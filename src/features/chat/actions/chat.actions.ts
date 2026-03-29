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
import {
  getWorkOrderActorContextForAction,
  getWorkOrderMemberCount,
} from "@/features/work-orders/api/work-orders";
import { getValidFiles, registruumFilesBucket } from "@/lib/supabase/storage";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
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

  const memberCount = await getWorkOrderMemberCount(
    parsed.data.spaceId,
    parsed.data.workOrderId,
  );

  if (memberCount < 2) {
    return {
      error: "Need 2 or more members.",
    };
  }

  const messageId = crypto.randomUUID();
  const { data: messageRow, error: insertError } = await context.supabase
    .from("work_order_messages")
    .insert({
      id: messageId,
      work_order_id: context.workOrder.id,
      sender_user_id: context.user.id,
      body: parsed.data.body,
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

  revalidatePath(
    `/space/${parsed.data.spaceId}/work-order/${parsed.data.workOrderId}/chat`,
  );
  revalidatePath(
    `/space/${parsed.data.spaceId}/work-order/${parsed.data.workOrderId}/documents`,
  );

  return {};
}
