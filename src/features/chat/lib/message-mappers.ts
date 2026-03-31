import { normalizeStoredMessageBody } from "@/features/chat/lib/message-body";
import { formatDateTimeLabel } from "@/lib/utils";
import type { Database } from "@/types/database";
import type { Message, MessageAttachment } from "@/types/message";

export type MessageRow = Database["public"]["Tables"]["work_order_messages"]["Row"];
export type AttachmentRow =
  Database["public"]["Tables"]["work_order_message_attachments"]["Row"];
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
  currentUserId: string,
): Message {
  return {
    id: row.id,
    kind: "user",
    workOrderId: row.work_order_id,
    senderUserId: row.sender_user_id,
    senderName:
      profileById.get(row.sender_user_id)?.full_name ?? "Unknown User",
    body: normalizeStoredMessageBody(row.body),
    createdAt: formatDateTimeLabel(row.created_at),
    rawCreatedAt: row.created_at,
    isCurrentUser: row.sender_user_id === currentUserId,
    attachments: attachmentMap.get(row.id) ?? [],
    status: "sent",
  };
}
