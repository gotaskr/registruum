import type { SupabaseClient } from "@supabase/supabase-js";
import { buildLinkTitle, extractUniqueUrlsFromText, inferDocumentKindFromFile } from "@/features/documents/lib/document-system";
import { attachmentsOnlyMessageBody } from "@/features/chat/lib/message-body";
import {
  collectMentionedUserIdsByName,
} from "@/features/chat/lib/mentions";
import {
  mapAttachmentRow,
  mapMessageRow,
  type AttachmentRow,
  type MessageRow,
  type ProfileRow,
  type ReactionRow,
} from "@/features/chat/lib/message-mappers";
import { createWorkOrderMessageSchema } from "@/features/chat/schemas/chat.schema";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  buildDocumentTitle,
  buildWorkOrderStoragePath,
  registruumFilesBucket,
  uploadFileToStorage,
} from "@/lib/supabase/storage";
import { formatDateTimeLabel } from "@/lib/utils";
import type { Database } from "@/types/database";
import type { Message, MessageAttachment } from "@/types/message";

type BrowserSupabaseClient = SupabaseClient<Database>;

type UploadedDocument = Readonly<{
  id: string;
  fileName: string;
  fileSizeBytes: number | null;
  mimeType: string | null;
  storagePath: string;
}>;

type CreatedDocumentLink = Readonly<{
  id: string;
}>;

export type SendWorkOrderMessageInput = Readonly<{
  spaceId: string;
  workOrderId: string;
  actorUserId: string;
  actorName: string;
  body: string;
  files: ReadonlyArray<File>;
  replyToMessageId?: string | null;
  messageId?: string;
}>;

export type GetWorkOrderMessageByIdInput = Readonly<{
  messageId: string;
  currentUserId: string;
}>;

function toMessageError(error: unknown, fallback = "Unable to send message.") {
  return error instanceof Error ? error : new Error(fallback);
}

function mapOptimisticAttachment(messageId: string, file: File): MessageAttachment {
  const previewUrl = URL.createObjectURL(file);

  return {
    id: `${messageId}:${file.name}:${file.lastModified}:${file.size}`,
    documentId: null,
    fileName: file.name,
    fileSizeBytes: file.size,
    mimeType: file.type || null,
    storagePath: `optimistic:${messageId}:${file.name}`,
    isImage: file.type.startsWith("image/"),
    previewUrl: file.type.startsWith("image/") ? previewUrl : null,
    downloadUrl: previewUrl,
  };
}

function buildActivitySummary(body: string, files: ReadonlyArray<File>) {
  const trimmedBody = body.trim();

  return (
    trimmedBody.slice(0, 120) ||
    (files.length > 1
      ? `${files.length} attached files`
      : files[0]?.name ?? "Sent a message")
  );
}

async function createActivityLogEntry(
  supabase: BrowserSupabaseClient,
  input: {
    messageId: string;
    spaceId: string;
    workOrderId: string;
    actorUserId: string;
    body: string;
    files: ReadonlyArray<File>;
  },
) {
  const { error } = await supabase.from("activity_logs").insert({
    action:
      input.files.length > 0
        ? "Sent a work order message with attachments"
        : "Sent a work order message",
    actor_user_id: input.actorUserId,
    space_id: input.spaceId,
    work_order_id: input.workOrderId,
    entity_type: "message",
    entity_id: input.messageId,
    details: {
      summary: buildActivitySummary(input.body, input.files),
    },
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function createMentionNotifications(
  supabase: BrowserSupabaseClient,
  input: {
    spaceId: string;
    workOrderId: string;
    messageId: string;
    actorUserId: string;
    actorName: string;
    body: string;
  },
) {
  if (!input.body.includes("@")) {
    return;
  }
  const { data: memberRows, error: memberError } = await supabase
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
  const { data: profiles, error: profilesError } = await supabase
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
  const { error: logError } = await supabase.from("activity_logs").insert(
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

  if (logError) {
    throw new Error(logError.message);
  }
}

async function uploadMessageFilesAsDocuments(
  supabase: BrowserSupabaseClient,
  input: {
    files: ReadonlyArray<File>;
    spaceId: string;
    workOrderId: string;
    uploadedByUserId: string;
    messageId: string;
    sourceSentAt: string;
  },
): Promise<UploadedDocument[]> {
  const uploadedDocuments: UploadedDocument[] = [];

  try {
    for (const file of input.files) {
      const documentId = crypto.randomUUID();
      const storagePath = buildWorkOrderStoragePath({
        spaceId: input.spaceId,
        workOrderId: input.workOrderId,
        scope: "messages",
        fileName: file.name,
        parentId: input.messageId,
      });

      await uploadFileToStorage({
        supabase,
        path: storagePath,
        file,
      });

      const { error } = await supabase.from("documents").insert({
        id: documentId,
        space_id: input.spaceId,
        work_order_id: input.workOrderId,
        uploaded_by_user_id: input.uploadedByUserId,
        title: buildDocumentTitle(file.name) || file.name,
        file_name: file.name,
        mime_type: file.type || null,
        storage_path: storagePath,
        file_size_bytes: file.size,
        document_kind: inferDocumentKindFromFile(file.name, file.type || null),
        source: "chat",
        chat_message_id: input.messageId,
        source_sent_at: input.sourceSentAt,
      });

      if (error) {
        await supabase.storage.from(registruumFilesBucket).remove([storagePath]);
        throw new Error(error.message);
      }

      uploadedDocuments.push({
        id: documentId,
        fileName: file.name,
        fileSizeBytes: file.size,
        mimeType: file.type || null,
        storagePath,
      });
    }
  } catch (error) {
    if (uploadedDocuments.length > 0) {
      await supabase
        .from("documents")
        .delete()
        .in(
          "id",
          uploadedDocuments.map((document) => document.id),
        );

      await supabase.storage
        .from(registruumFilesBucket)
        .remove(uploadedDocuments.map((document) => document.storagePath));
    }

    throw toMessageError(error);
  }

  return uploadedDocuments;
}

async function createWorkOrderLinksAsDocuments(
  supabase: BrowserSupabaseClient,
  input: {
    links: ReadonlyArray<{ url: string }>;
    spaceId: string;
    workOrderId: string;
    uploadedByUserId: string;
    messageId: string;
    sourceSentAt: string;
  },
): Promise<CreatedDocumentLink[]> {
  const createdDocuments: CreatedDocumentLink[] = [];

  try {
    for (const link of input.links) {
      const documentId = crypto.randomUUID();
      const { error } = await supabase.from("documents").insert({
        id: documentId,
        space_id: input.spaceId,
        work_order_id: input.workOrderId,
        uploaded_by_user_id: input.uploadedByUserId,
        title: buildLinkTitle(link.url),
        file_name: link.url,
        mime_type: null,
        storage_path: null,
        file_size_bytes: null,
        document_kind: "link",
        source: "chat",
        external_url: link.url,
        chat_message_id: input.messageId,
        source_sent_at: input.sourceSentAt,
      });

      if (error) {
        throw new Error(error.message);
      }

      createdDocuments.push({
        id: documentId,
      });
    }
  } catch (error) {
    if (createdDocuments.length > 0) {
      await supabase
        .from("documents")
        .delete()
        .in(
          "id",
          createdDocuments.map((document) => document.id),
        );
    }

    throw toMessageError(error);
  }

  return createdDocuments;
}

async function getSignedUrlByPath(
  supabase: BrowserSupabaseClient,
  attachments: ReadonlyArray<AttachmentRow>,
) {
  const signedUrlByPath = new Map<string, string>();

  if (attachments.length === 0) {
    return signedUrlByPath;
  }

  const signedUrlResults = await Promise.all(
    attachments.map(async (attachment) => {
      const { data, error } = await supabase.storage
        .from(registruumFilesBucket)
        .createSignedUrl(attachment.storage_path, 60 * 60);

      if (error || !data?.signedUrl) {
        return null;
      }

      return [attachment.storage_path, data.signedUrl] as const;
    }),
  );

  for (const result of signedUrlResults) {
    if (result) {
      signedUrlByPath.set(result[0], result[1]);
    }
  }

  return signedUrlByPath;
}

function fallbackMessageFromRow(
  row: MessageRow,
  actorUserId: string,
  actorName: string,
): Message {
  return {
    id: row.id,
    kind: "user",
    workOrderId: row.work_order_id,
    senderUserId: row.sender_user_id,
    senderName: actorName,
    body: row.body === attachmentsOnlyMessageBody ? "" : row.body,
    createdAt: formatDateTimeLabel(row.created_at),
    rawCreatedAt: row.created_at,
    isCurrentUser: row.sender_user_id === actorUserId,
    attachments: [],
    replyToMessageId: row.reply_to_message_id,
    replyToPreview: null,
    deletedAt: row.deleted_at,
    deletedByCurrentUser: row.deleted_by_user_id === actorUserId,
    reactions: { up: 0, down: 0, currentUserReaction: null },
    status: "sent",
  };
}

export function createOptimisticMessage(
  input: Omit<SendWorkOrderMessageInput, "messageId"> & {
    messageId?: string;
    createdAt?: string;
  },
): Message {
  const rawCreatedAt = input.createdAt ?? new Date().toISOString();
  const messageId = input.messageId ?? crypto.randomUUID();

  return {
    id: messageId,
    kind: "user",
    workOrderId: input.workOrderId,
    senderUserId: input.actorUserId,
    senderName: input.actorName,
    body: input.body.trim(),
    createdAt: formatDateTimeLabel(rawCreatedAt),
    rawCreatedAt,
    isCurrentUser: true,
    attachments: input.files.map((file) => mapOptimisticAttachment(messageId, file)),
    replyToMessageId: input.replyToMessageId ?? null,
    replyToPreview: null,
    deletedAt: null,
    deletedByCurrentUser: false,
    reactions: { up: 0, down: 0, currentUserReaction: null },
    status: "sending",
  };
}

export function revokeMessageObjectUrls(message: Message) {
  for (const attachment of message.attachments) {
    if (attachment.previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(attachment.previewUrl);
    }

    if (
      attachment.downloadUrl?.startsWith("blob:") &&
      attachment.downloadUrl !== attachment.previewUrl
    ) {
      URL.revokeObjectURL(attachment.downloadUrl);
    }
  }
}

export async function getWorkOrderMessageById({
  messageId,
  currentUserId,
}: GetWorkOrderMessageByIdInput) {
  const supabase = createSupabaseBrowserClient();
  const { data: messageRow, error: messageError } = await supabase
    .from("work_order_messages")
    .select("*")
    .eq("id", messageId)
    .maybeSingle();

  if (messageError) {
    throw new Error(messageError.message);
  }

  if (!messageRow) {
    return null;
  }

  const [profileResult, attachmentResult, reactionResult, previewResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("id", messageRow.sender_user_id)
      .maybeSingle(),
    supabase
      .from("work_order_message_attachments")
      .select("*")
      .eq("message_id", messageId),
    supabase
      .from("work_order_message_reactions")
      .select("*")
      .eq("message_id", messageId),
    messageRow.reply_to_message_id
      ? supabase
          .from("work_order_messages")
          .select("id, body, deleted_at")
          .eq("id", messageRow.reply_to_message_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (profileResult.error) {
    throw new Error(profileResult.error.message);
  }

  if (attachmentResult.error) {
    throw new Error(attachmentResult.error.message);
  }
  if (reactionResult.error) {
    throw new Error(reactionResult.error.message);
  }
  if (previewResult.error) {
    throw new Error(previewResult.error.message);
  }

  const profileById = new Map<string, ProfileRow>();
  if (profileResult.data) {
    profileById.set(profileResult.data.id, profileResult.data as ProfileRow);
  }

  const attachments = (attachmentResult.data ?? []) as AttachmentRow[];
  const reactions = (reactionResult.data ?? []) as ReactionRow[];
  const signedUrlByPath = await getSignedUrlByPath(supabase, attachments);
  const attachmentMap = new Map<string, MessageAttachment[]>();
  const reactionsByMessageId = new Map<string, ReactionRow[]>();
  const previewByMessageId = new Map<string, string>();

  attachmentMap.set(
    messageId,
    attachments.map((attachment) => mapAttachmentRow(attachment, signedUrlByPath)),
  );
  reactionsByMessageId.set(messageId, reactions);
  if (previewResult.data?.id) {
    const text = previewResult.data.deleted_at
      ? "Message deleted"
      : String(previewResult.data.body ?? "").trim().slice(0, 100);
    previewByMessageId.set(previewResult.data.id, text || "Attachment");
  }

  return mapMessageRow(
    messageRow as MessageRow,
    profileById,
    attachmentMap,
    reactionsByMessageId,
    previewByMessageId,
    currentUserId,
  );
}

export async function sendWorkOrderMessage(
  input: SendWorkOrderMessageInput,
): Promise<Message> {
  const parsed = createWorkOrderMessageSchema.safeParse({
    spaceId: input.spaceId,
    workOrderId: input.workOrderId,
    body: input.body,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Unable to send message.");
  }

  const files = input.files.filter((file) => file.size > 0);
  if (!parsed.data.body && files.length === 0) {
    throw new Error("Message cannot be empty.");
  }

  const supabase = createSupabaseBrowserClient();
  const messageId = input.messageId ?? crypto.randomUUID();
  const storedBody =
    parsed.data.body || (files.length > 0 ? attachmentsOnlyMessageBody : "");
  const { data: insertedMessage, error: messageError } = await supabase
    .from("work_order_messages")
    .insert({
      id: messageId,
      work_order_id: parsed.data.workOrderId,
      sender_user_id: input.actorUserId,
      body: storedBody,
      reply_to_message_id: input.replyToMessageId ?? null,
    })
    .select("*")
    .single();

  if (messageError || !insertedMessage) {
    throw new Error(messageError?.message ?? "Unable to send message.");
  }

  let uploadedDocuments: UploadedDocument[] = [];
  let createdLinkDocuments: CreatedDocumentLink[] = [];
  const sentAt = new Date().toISOString();

  try {
    if (files.length > 0) {
      uploadedDocuments = await uploadMessageFilesAsDocuments(supabase, {
        files,
        spaceId: parsed.data.spaceId,
        workOrderId: parsed.data.workOrderId,
        uploadedByUserId: input.actorUserId,
        messageId,
        sourceSentAt: sentAt,
      });

      const { error: attachmentError } = await supabase
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

    const links = extractUniqueUrlsFromText(parsed.data.body);
    if (links.length > 0) {
      createdLinkDocuments = await createWorkOrderLinksAsDocuments(supabase, {
        links: links.map((url) => ({ url })),
        spaceId: parsed.data.spaceId,
        workOrderId: parsed.data.workOrderId,
        uploadedByUserId: input.actorUserId,
        messageId,
        sourceSentAt: sentAt,
      });
    }
  } catch (error) {
    if (uploadedDocuments.length > 0) {
      await supabase
        .from("documents")
        .delete()
        .in(
          "id",
          uploadedDocuments.map((document) => document.id),
        );

      await supabase.storage
        .from(registruumFilesBucket)
        .remove(uploadedDocuments.map((document) => document.storagePath));
    }

    if (createdLinkDocuments.length > 0) {
      await supabase
        .from("documents")
        .delete()
        .in(
          "id",
          createdLinkDocuments.map((document) => document.id),
        );
    }

    await supabase.from("work_order_messages").delete().eq("id", messageId);
    throw toMessageError(error);
  }

  try {
    await createActivityLogEntry(supabase, {
      messageId,
      spaceId: parsed.data.spaceId,
      workOrderId: parsed.data.workOrderId,
      actorUserId: input.actorUserId,
      body: parsed.data.body,
      files,
    });
    await createMentionNotifications(supabase, {
      spaceId: parsed.data.spaceId,
      workOrderId: parsed.data.workOrderId,
      messageId,
      actorUserId: input.actorUserId,
      actorName: input.actorName,
      body: parsed.data.body,
    });
  } catch (error) {
    console.error(toMessageError(error, "Unable to write chat activity log."));
  }

  return (
    (await getWorkOrderMessageById({
      messageId,
      currentUserId: input.actorUserId,
    })) ??
    fallbackMessageFromRow(
      insertedMessage as MessageRow,
      input.actorUserId,
      input.actorName,
    )
  );
}

export async function toggleMessageReaction(input: {
  messageId: string;
  userId: string;
  reaction: "up" | "down";
}) {
  const supabase = createSupabaseBrowserClient();
  const { data: existing, error: existingError } = await supabase
    .from("work_order_message_reactions")
    .select("reaction")
    .eq("message_id", input.messageId)
    .eq("user_id", input.userId)
    .maybeSingle();
  if (existingError) {
    throw new Error(existingError.message);
  }
  if (existing?.reaction === input.reaction) {
    const { error } = await supabase
      .from("work_order_message_reactions")
      .delete()
      .eq("message_id", input.messageId)
      .eq("user_id", input.userId);
    if (error) {
      throw new Error(error.message);
    }
    return;
  }
  const { error } = await supabase.from("work_order_message_reactions").upsert(
    {
      message_id: input.messageId,
      user_id: input.userId,
      reaction: input.reaction,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "message_id,user_id" },
  );
  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteWorkOrderMessage(input: { messageId: string; userId: string }) {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase
    .from("work_order_messages")
    .update({
      body: "Message deleted",
      deleted_at: new Date().toISOString(),
      deleted_by_user_id: input.userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.messageId)
    .eq("sender_user_id", input.userId);
  if (error) {
    throw new Error(error.message);
  }
}
