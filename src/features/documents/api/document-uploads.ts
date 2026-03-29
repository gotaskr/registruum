import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { buildLinkTitle, inferDocumentKindFromFile } from "@/features/documents/lib/document-system";
import type { WorkOrderDocumentKind } from "@/features/documents/types/document-browser";
import {
  buildDocumentTitle,
  buildWorkOrderStoragePath,
  registruumFilesBucket,
  uploadFileToStorage,
} from "@/lib/supabase/storage";
import type { Database } from "@/lib/supabase/database.types";

type ServerSupabaseClient = SupabaseClient<Database>;
type DocumentSource = Database["public"]["Tables"]["documents"]["Row"]["source"];

export type UploadedDocument = Readonly<{
  id: string;
  fileName: string;
  fileSizeBytes: number | null;
  mimeType: string | null;
  storagePath: string;
  kind: WorkOrderDocumentKind;
}>;

export type CreatedDocumentLink = Readonly<{
  id: string;
  fileName: string;
  kind: "link";
}>;

type UploadWorkOrderFilesInput = Readonly<{
  supabase: ServerSupabaseClient;
  files: File[];
  spaceId: string;
  workOrderId: string;
  uploadedByUserId: string;
  scope: "documents" | "messages";
  parentId?: string;
  source: DocumentSource;
  chatMessageId?: string | null;
  sourceSentAt?: string | null;
}>;

type CreateWorkOrderLinksInput = Readonly<{
  supabase: ServerSupabaseClient;
  links: ReadonlyArray<{
    url: string;
    title?: string | null;
  }>;
  spaceId: string;
  workOrderId: string;
  uploadedByUserId: string;
  source: DocumentSource;
  chatMessageId?: string | null;
  sourceSentAt?: string | null;
}>;

export async function uploadWorkOrderFilesAsDocuments({
  supabase,
  files,
  spaceId,
  workOrderId,
  uploadedByUserId,
  scope,
  parentId,
  source,
  chatMessageId = null,
  sourceSentAt = null,
}: UploadWorkOrderFilesInput): Promise<UploadedDocument[]> {
  const uploadedDocuments: UploadedDocument[] = [];

  try {
    for (const file of files) {
      const documentId = crypto.randomUUID();
      const storagePath = buildWorkOrderStoragePath({
        spaceId,
        workOrderId,
        scope,
        fileName: file.name,
        parentId,
      });
      const kind = inferDocumentKindFromFile(file.name, file.type || null);

      await uploadFileToStorage({
        supabase,
        path: storagePath,
        file,
      });

      const { error: documentError } = await supabase.from("documents").insert({
        id: documentId,
        space_id: spaceId,
        work_order_id: workOrderId,
        uploaded_by_user_id: uploadedByUserId,
        title: buildDocumentTitle(file.name) || file.name,
        file_name: file.name,
        mime_type: file.type || null,
        storage_path: storagePath,
        file_size_bytes: file.size,
        document_kind: kind,
        source,
        chat_message_id: chatMessageId,
        source_sent_at: sourceSentAt,
      });

      if (documentError) {
        await supabase.storage.from(registruumFilesBucket).remove([storagePath]);
        throw new Error(documentError.message);
      }

      uploadedDocuments.push({
        id: documentId,
        fileName: file.name,
        fileSizeBytes: file.size,
        mimeType: file.type || null,
        storagePath,
        kind,
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
        .remove(
          uploadedDocuments
            .map((document) => document.storagePath)
            .filter((value): value is string => value !== null),
        );
    }

    throw error;
  }

  return uploadedDocuments;
}

export async function createWorkOrderLinksAsDocuments({
  supabase,
  links,
  spaceId,
  workOrderId,
  uploadedByUserId,
  source,
  chatMessageId = null,
  sourceSentAt = null,
}: CreateWorkOrderLinksInput): Promise<CreatedDocumentLink[]> {
  const createdDocuments: CreatedDocumentLink[] = [];

  try {
    for (const link of links) {
      const documentId = crypto.randomUUID();
      const { error } = await supabase.from("documents").insert({
        id: documentId,
        space_id: spaceId,
        work_order_id: workOrderId,
        uploaded_by_user_id: uploadedByUserId,
        title: link.title ?? buildLinkTitle(link.url),
        file_name: link.url,
        mime_type: null,
        storage_path: null,
        file_size_bytes: null,
        document_kind: "link",
        source,
        external_url: link.url,
        chat_message_id: chatMessageId,
        source_sent_at: sourceSentAt,
      });

      if (error) {
        throw new Error(error.message);
      }

      createdDocuments.push({
        id: documentId,
        fileName: link.url,
        kind: "link",
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

    throw error;
  }

  return createdDocuments;
}
