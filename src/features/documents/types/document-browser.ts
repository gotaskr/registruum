export type SystemDocumentFolderKey = "photos" | "videos" | "files" | "links";

export type WorkOrderDocumentKind = "photo" | "video" | "file" | "link";

export type WorkOrderDocumentSource = "manual" | "chat";

export type WorkOrderDocumentFolder = Readonly<{
  id: string;
  name: string;
  systemKey: SystemDocumentFolderKey;
  itemCount: number;
}>;

export type WorkOrderDocumentRecord = Readonly<{
  id: string;
  title: string;
  fileName: string;
  folderId: string | null;
  systemFolderKey: SystemDocumentFolderKey;
  kind: WorkOrderDocumentKind;
  storagePath: string | null;
  externalUrl: string | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
  uploadedByName: string;
  source: WorkOrderDocumentSource;
  chatMessageId: string | null;
  sentAt: string;
  createdAt: string;
  isArchived: boolean;
  previewUrl: string | null;
  downloadUrl: string | null;
}>;
