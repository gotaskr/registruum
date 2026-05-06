import { normalizeStoredMessageBody } from "@/features/chat/lib/message-body";
import { formatDateTimeLabel } from "@/lib/utils";
import type { Database } from "@/types/database";
import type { Message, MessageAttachment } from "@/types/message";

export type MessageRow = Database["public"]["Tables"]["work_order_messages"]["Row"];
export type AttachmentRow =
  Database["public"]["Tables"]["work_order_message_attachments"]["Row"];
export type ReactionRow =
  Database["public"]["Tables"]["work_order_message_reactions"]["Row"];
export type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name"
>;

export function isImageMimeType(value: string | null) {
  return Boolean(value && value.startsWith("image/"));
}

export function mapAttachmentRow(
  row: AttachmentRow,
  signedUrlByPath: Map<string, string>,
): MessageAttachment {
  const signedUrl = signedUrlByPath.get(row.storage_path) ?? null;

  return {
    id: row.id,
    documentId: row.document_id,
    fileName: row.file_name,
    fileSizeBytes: row.file_size_bytes,
    mimeType: row.mime_type,
    storagePath: row.storage_path,
    isImage: isImageMimeType(row.mime_type),
    previewUrl: isImageMimeType(row.mime_type) ? signedUrl : null,
    downloadUrl: signedUrl,
  };
}

export function mapMessageRow(
  row: MessageRow,
  profileById: Map<string, ProfileRow>,
  attachmentMap: Map<string, MessageAttachment[]>,
  reactionsByMessageId: Map<string, ReactionRow[]>,
  previewByMessageId: Map<string, string>,
  currentUserId: string,
): Message {
  const reactions = reactionsByMessageId.get(row.id) ?? [];
  const up = reactions.filter((reaction) => reaction.reaction === "up").length;
  const down = reactions.filter((reaction) => reaction.reaction === "down").length;
  const currentUserReaction =
    reactions.find((reaction) => reaction.user_id === currentUserId)?.reaction ?? null;
  const isDeleted = Boolean(row.deleted_at);
  const deletedByCurrentUser = row.deleted_by_user_id === currentUserId;

  return {
    id: row.id,
    kind: "user",
    workOrderId: row.work_order_id,
    senderUserId: row.sender_user_id,
    senderName:
      profileById.get(row.sender_user_id)?.full_name ?? "Unknown User",
    body: isDeleted
      ? deletedByCurrentUser
        ? "Message unsent"
        : "Message deleted"
      : normalizeStoredMessageBody(row.body),
    createdAt: formatDateTimeLabel(row.created_at),
    rawCreatedAt: row.created_at,
    isCurrentUser: row.sender_user_id === currentUserId,
    attachments: isDeleted ? [] : (attachmentMap.get(row.id) ?? []),
    replyToMessageId: row.reply_to_message_id,
    replyToPreview:
      row.reply_to_message_id ? (previewByMessageId.get(row.reply_to_message_id) ?? null) : null,
    deletedAt: row.deleted_at,
    deletedByCurrentUser,
    reactions: {
      up,
      down,
      currentUserReaction:
        currentUserReaction === "up" || currentUserReaction === "down"
          ? currentUserReaction
          : null,
    },
    status: "sent",
  };
}
