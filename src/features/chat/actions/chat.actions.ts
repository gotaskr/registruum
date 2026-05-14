"use server";

import { revalidatePath } from "next/cache";
import {
  createWorkOrderLinksAsDocuments,
  uploadWorkOrderFilesAsDocuments,
} from "@/features/documents/api/document-uploads";
import { extractUniqueUrlsFromText } from "@/features/documents/lib/document-system";
import { createActivityLog } from "@/features/logs/api/activity-logs";
import { getLockedWorkOrderMessage } from "@/features/permissions/lib/work-order-permissions";
import { createWorkOrderMessageSchema } from "@/features/chat/schemas/chat.schema";
import {
  initialChatActionState,
  type ChatActionState,
} from "@/features/chat/types/chat-action-state";
import { attachmentsOnlyMessageBody } from "@/features/chat/lib/message-body";
import {
  collectMentionedUserIdsByName,
} from "@/features/chat/lib/mentions";
import {
  getBandwidthPlanLimitBlock,
  getDocumentStorageUploadPlanLimitBlock,
} from "@/features/settings/lib/subscription-enforcement";
import {
  getWorkOrderActorContextForAction,
  getWorkOrderMemberCount,
} from "@/features/work-orders/api/work-orders";
import { getValidFiles, registruumFilesBucket } from "@/lib/supabase/storage";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function createMentionNotifications(input: {
  supabase: Awaited<NonNullable<Awaited<ReturnType<typeof getWorkOrderActorContextForAction>>>>["supabase"];
  spaceId: string;
  workOrderId: string;
  messageId: string;
  actorUserId: string;
  actorName: string;
  body: string;
}) {
  if (!input.body.includes("@")) {
    return;
  }
  const { data: memberRows, error: memberError } = await input.supabase
    .from("work_order_memberships")
    .select("user_id")
    .eq("work_order_id", input.workOrderId);

  if (memberError) {
    throw new Error(memberError.message);
  }

  const memberUserIds = [...new Set((memberRows ?? []).map((row) => row.user_id))];
  if (memberUserIds.length === 0) {
    return;
  }
  const { data: profiles, error: profilesError } = await input.supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", memberUserIds);
  if (profilesError) {
    throw new Error(profilesError.message);
  }
  const mentionedUserIds = collectMentionedUserIdsByName(
    input.body,
    (profiles ?? []).map((profile) => ({
      userId: profile.id,
      fullName: profile.full_name,
    })),
  ).filter((userId) => userId !== input.actorUserId);

  if (mentionedUserIds.length === 0) {
    return;
  }

  const summary = input.body.trim().slice(0, 120) || "Mentioned you in chat";
  const { error: mentionError } = await input.supabase.from("activity_logs").insert(
    mentionedUserIds.map((mentionedUserId) => ({
      action: "Mentioned you in chat",
      actor_user_id: input.actorUserId,
      space_id: input.spaceId,
      work_order_id: input.workOrderId,
      entity_type: "message" as const,
      entity_id: input.messageId,
      details: {
        summary,
        mentioned_user_id: mentionedUserId,
        actor_name: input.actorName,
      },
    })),
  );

  if (mentionError) {
    throw new Error(mentionError.message);
  }
}

export async function createWorkOrderMessage(
  previousState: ChatActionState = initialChatActionState,
  formData: FormData,
): Promise<ChatActionState> {
  void previousState;
  const files = getValidFiles(formData, "files");
  const body = readText(formData, "body");
  const links = extractUniqueUrlsFromText(body);
  const parsed = createWorkOrderMessageSchema.safeParse({
    spaceId: readText(formData, "spaceId"),
    workOrderId: readText(formData, "workOrderId"),
    body,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Unable to send message.",
    };
  }

  if (!parsed.data.body && files.length === 0) {
    return {
      error: "Message cannot be empty.",
    };
  }

  const context = await getWorkOrderActorContextForAction(
    parsed.data.spaceId,
    parsed.data.workOrderId,
  );

  if (!context) {
    return {
      error: "You do not have access to this work order.",
    };
  }

  if (!context.permissions.canSendMessage) {
    return {
      error:
        getLockedWorkOrderMessage(context.workOrder.status) ??
        "You cannot send messages in this work order.",
    };
  }

  if (files.length > 0) {
    const additionalBytes = files.reduce((sum, file) => sum + Math.max(0, file.size), 0);
    const storageBlock = await getDocumentStorageUploadPlanLimitBlock(
      parsed.data.spaceId,
      additionalBytes,
      context.user.id,
    );
    if (storageBlock) {
      return { error: storageBlock.message, upgradePrompt: storageBlock.upgradePrompt };
    }

    const bandwidthBlock = await getBandwidthPlanLimitBlock(parsed.data.spaceId);
    if (bandwidthBlock) {
      return { error: bandwidthBlock.message, upgradePrompt: bandwidthBlock.upgradePrompt };
    }
  }

  const memberCount = await getWorkOrderMemberCount(
    parsed.data.spaceId,
    parsed.data.workOrderId,
  );

  if (memberCount < 2) {
    return {
      error: "Need 2 or more members.",
    };
  }

  const storedBody =
    parsed.data.body || (files.length > 0 ? attachmentsOnlyMessageBody : "");
  const messageId = crypto.randomUUID();
  const { data: messageRow, error: insertError } = await context.supabase
    .from("work_order_messages")
    .insert({
      id: messageId,
      work_order_id: context.workOrder.id,
      sender_user_id: context.user.id,
      body: storedBody,
    })
    .select("id")
    .single();

  if (insertError || !messageRow) {
    return {
      error: insertError?.message ?? "Unable to send message.",
    };
  }

  let uploadedDocuments:
    | Awaited<ReturnType<typeof uploadWorkOrderFilesAsDocuments>>
    | null = null;
  let createdLinkDocuments:
    | Awaited<ReturnType<typeof createWorkOrderLinksAsDocuments>>
    | null = null;
  const sentAt = new Date().toISOString();

  try {
    if (files.length > 0) {
      uploadedDocuments = await uploadWorkOrderFilesAsDocuments({
        supabase: context.supabase,
        files,
        spaceId: parsed.data.spaceId,
        workOrderId: parsed.data.workOrderId,
        uploadedByUserId: context.user.id,
        scope: "messages",
        parentId: messageId,
        source: "chat",
        chatMessageId: messageId,
        sourceSentAt: sentAt,
      });

      const { error: attachmentError } = await context.supabase
        .from("work_order_message_attachments")
        .insert(
          uploadedDocuments.map((document) => ({
            message_id: messageId,
            document_id: document.id,
            file_name: document.fileName,
            mime_type: document.mimeType,
            file_size_bytes: document.fileSizeBytes,
            storage_path: document.storagePath,
          })),
        );

      if (attachmentError) {
        throw new Error(attachmentError.message);
      }
    }

    if (links.length > 0) {
      createdLinkDocuments = await createWorkOrderLinksAsDocuments({
        supabase: context.supabase,
        links: links.map((url) => ({ url })),
        spaceId: parsed.data.spaceId,
        workOrderId: parsed.data.workOrderId,
        uploadedByUserId: context.user.id,
        source: "chat",
        chatMessageId: messageId,
        sourceSentAt: sentAt,
      });
    }
  } catch (error) {
    if (uploadedDocuments && uploadedDocuments.length > 0) {
      await context.supabase
        .from("documents")
        .delete()
        .in(
          "id",
          uploadedDocuments.map((document) => document.id),
        );

      await context.supabase.storage
        .from(registruumFilesBucket)
        .remove(
          uploadedDocuments
            .map((document) => document.storagePath)
            .filter((value): value is string => value !== null),
        );
    }

    if (createdLinkDocuments && createdLinkDocuments.length > 0) {
      await context.supabase
        .from("documents")
        .delete()
        .in(
          "id",
          createdLinkDocuments.map((document) => document.id),
        );
    }

    await context.supabase
      .from("work_order_messages")
      .delete()
      .eq("id", messageId);

    return {
      error: error instanceof Error ? error.message : "Unable to send message.",
    };
  }

  await createActivityLog({
    supabase: context.supabase,
    action:
      files.length > 0
        ? "Sent a work order message with attachments"
        : "Sent a work order message",
    actorUserId: context.user.id,
    spaceId: parsed.data.spaceId,
    workOrderId: parsed.data.workOrderId,
    entityType: "message",
    entityId: messageRow.id,
    details: {
      summary:
        parsed.data.body.slice(0, 120) ||
        (files.length > 1
          ? `${files.length} attached files`
          : files[0]?.name ?? "Sent a message"),
    },
  });
  await createMentionNotifications({
    supabase: context.supabase,
    spaceId: parsed.data.spaceId,
    workOrderId: parsed.data.workOrderId,
    messageId: messageRow.id,
    actorUserId: context.user.id,
    actorName: context.profile.fullName,
    body: parsed.data.body,
  });

  revalidatePath(
    `/space/${parsed.data.spaceId}/work-order/${parsed.data.workOrderId}/chat`,
  );
  revalidatePath(
    `/space/${parsed.data.spaceId}/work-order/${parsed.data.workOrderId}/documents`,
  );

  return {};
}
