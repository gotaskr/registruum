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

export type Message = Readonly<{
  id: string;
  kind: "user" | "system";
  workOrderId: string;
  senderUserId: string | null;
  senderName: string;
  body: string;
  createdAt: string;
  isCurrentUser: boolean;
  attachments: MessageAttachment[];
}>;
