import "server-only";

import {
  getSystemFolderId,
  getSystemFolderKeyForDocumentKind,
  systemDocumentFolders,
} from "@/features/documents/lib/document-system";
import { getWorkOrderActorContext } from "@/features/work-orders/api/work-orders";
import { formatDateTimeLabel } from "@/lib/utils";
import { registruumFilesBucket } from "@/lib/supabase/storage";
import type { Database } from "@/types/database";
import type {
  WorkOrderDocumentFolder,
  WorkOrderDocumentRecord,
} from "@/features/documents/types/document-browser";

type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];
type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name"
>;

type WorkOrderDocumentsResult = Readonly<{
  folders: WorkOrderDocumentFolder[];
  documents: WorkOrderDocumentRecord[];
}>;

export async function getWorkOrderDocuments(
  spaceId: string,
  workOrderId: string,
): Promise<WorkOrderDocumentsResult> {
  const context = await getWorkOrderActorContext(spaceId, workOrderId);
  const { data: documentRows, error: documentError } = await context.supabase
    .from("documents")
    .select("*")
    .eq("space_id", spaceId)
    .eq("work_order_id", workOrderId)
    .order("created_at", { ascending: false });

  if (documentError) {
    throw new Error(documentError.message);
  }

  const documents = (documentRows ?? []) as DocumentRow[];
  const profileIds = [...new Set(documents.map((document) => document.uploaded_by_user_id))];
  const profileById = new Map<string, ProfileRow>();

  if (profileIds.length > 0) {
    const { data: profileRows, error: profileError } = await context.supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", profileIds);

    if (profileError) {
      throw new Error(profileError.message);
    }

    for (const profile of (profileRows ?? []) as ProfileRow[]) {
      profileById.set(profile.id, profile);
    }
  }

  const storagePaths = documents
    .map((document) => document.storage_path)
    .filter((value): value is string => value !== null);
  const signedUrlByPath = new Map<string, string>();

  if (storagePaths.length > 0) {
    const signedUrlResults = await Promise.all(
      storagePaths.map(async (storagePath) => {
        const { data, error } = await context.supabase.storage
          .from(registruumFilesBucket)
          .createSignedUrl(storagePath, 60 * 60);

        if (error || !data?.signedUrl) {
          return null;
        }

        return [storagePath, data.signedUrl] as const;
      }),
    );

    for (const result of signedUrlResults) {
      if (result) {
        signedUrlByPath.set(result[0], result[1]);
      }
    }
  }

  const itemCountByFolderKey = new Map<string, number>();

  for (const document of documents) {
    const systemFolderKey = getSystemFolderKeyForDocumentKind(
      document.document_kind as WorkOrderDocumentRecord["kind"],
    );
    itemCountByFolderKey.set(
      systemFolderKey,
      (itemCountByFolderKey.get(systemFolderKey) ?? 0) + 1,
    );
  }

  return {
    folders: systemDocumentFolders.map((folder) => ({
      id: getSystemFolderId(folder.key),
      name: folder.name,
      systemKey: folder.key,
      itemCount: itemCountByFolderKey.get(folder.key) ?? 0,
    })),
    documents: documents.map((document) => ({
      id: document.id,
      title: document.title,
      fileName: document.file_name,
      folderId: document.folder_id,
      systemFolderKey: getSystemFolderKeyForDocumentKind(
        document.document_kind as WorkOrderDocumentRecord["kind"],
      ),
      kind: document.document_kind as WorkOrderDocumentRecord["kind"],
      storagePath: document.storage_path,
      externalUrl: document.external_url,
      mimeType: document.mime_type,
      fileSizeBytes: document.file_size_bytes,
      uploadedByName:
        profileById.get(document.uploaded_by_user_id)?.full_name ?? "Unknown User",
      source: document.source as WorkOrderDocumentRecord["source"],
      chatMessageId: document.chat_message_id,
      sentAt: formatDateTimeLabel(document.source_sent_at ?? document.created_at),
      createdAt: formatDateTimeLabel(document.created_at),
      isArchived: document.is_archived,
      previewUrl:
        document.document_kind === "photo" && document.storage_path
          ? (signedUrlByPath.get(document.storage_path) ?? null)
          : null,
      downloadUrl: document.storage_path
        ? (signedUrlByPath.get(document.storage_path) ?? null)
        : document.external_url,
    })),
  };
}
