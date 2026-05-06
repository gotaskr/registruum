export type MessageAttachment = Readonly<{
  id: string;
  documentId: string | null;
  fileName: string;
  fileSizeBytes: number | null;
  mimeType: string | null;
  storagePath: string;
  isImage: boolean;
  previewUrl: string | null;
  downloadUrl: string | null;
}>;

export type MessageDeliveryStatus = "sending" | "sent" | "failed";
export type MessageReactionKind = "up" | "down";

export type Message = Readonly<{
  id: string;
  kind: "user" | "system";
  workOrderId: string;
  senderUserId: string | null;
  senderName: string;
  body: string;
  createdAt: string;
  rawCreatedAt: string;
  isCurrentUser: boolean;
  attachments: MessageAttachment[];
  replyToMessageId: string | null;
  replyToPreview: string | null;
  deletedAt: string | null;
  deletedByCurrentUser: boolean;
  reactions: Readonly<{
    up: number;
    down: number;
    currentUserReaction: MessageReactionKind | null;
  }>;
  status?: MessageDeliveryStatus;
}>;
