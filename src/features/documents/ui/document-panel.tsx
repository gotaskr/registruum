"use client";

import { useActionState, useState } from "react";
import { Link2, Upload } from "lucide-react";
import { FileUploadField } from "@/components/ui/file-upload-field";
import { FormMessage } from "@/features/auth/ui/form-message";
import {
  createDocumentLink,
  deleteDocumentItem,
  uploadWorkOrderDocuments,
} from "@/features/documents/actions/document.actions";
import { initialDocumentActionState } from "@/features/documents/types/document-action-state";
import { DocumentFolderList } from "@/features/documents/ui/document-folder-list";
import { DocumentItemGrid } from "@/features/documents/ui/document-item-grid";
import type {
  SystemDocumentFolderKey,
  WorkOrderDocumentFolder,
  WorkOrderDocumentRecord,
} from "@/features/documents/types/document-browser";

type DocumentPanelProps = Readonly<{
  spaceId: string;
  workOrderId: string;
  folders: WorkOrderDocumentFolder[];
  documents: WorkOrderDocumentRecord[];
  canUploadDocuments: boolean;
  canDeleteDocuments: boolean;
  lockedMessage?: string;
}>;

export function DocumentPanel({
  spaceId,
  workOrderId,
  folders,
  documents,
  canUploadDocuments,
  canDeleteDocuments,
  lockedMessage,
}: DocumentPanelProps) {
  const [selectedFolderKey, setSelectedFolderKey] =
    useState<SystemDocumentFolderKey>("photos");
  const [selectedFileCount, setSelectedFileCount] = useState(0);
  const [uploadState, uploadFormAction] = useActionState(
    uploadWorkOrderDocuments,
    initialDocumentActionState,
  );
  const [linkState, linkFormAction] = useActionState(
    createDocumentLink,
    initialDocumentActionState,
  );
  const [deleteState, deleteFormAction] = useActionState(
    deleteDocumentItem,
    initialDocumentActionState,
  );
  const selectedFolder = folders.find((folder) => folder.systemKey === selectedFolderKey) ?? folders[0];
  const actionMessage = uploadState.error ?? linkState.error ?? deleteState.error;

  return (
    <section className="min-h-0">
      <DocumentFolderList
        folders={folders}
        selectedFolderKey={selectedFolderKey}
        onSelect={setSelectedFolderKey}
      />
      <div className="grid gap-0 border-b border-border xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="border-b border-border px-6 py-4 xl:border-r xl:border-b-0">
          <form action={uploadFormAction} className="space-y-3">
            <input type="hidden" name="spaceId" value={spaceId} />
            <input type="hidden" name="workOrderId" value={workOrderId} />
            <FileUploadField
              name="files"
              buttonLabel="Select Files"
              helperText="Photos, videos, and files are sorted into system folders automatically."
              disabled={!canUploadDocuments}
              accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.txt,.mp4,.mov,.webm,.avi,.mkv"
              onFilesChange={setSelectedFileCount}
            />
            <button
              type="submit"
              disabled={!canUploadDocuments || selectedFileCount === 0}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-[#2b6ef3] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload to Documents
            </button>
          </form>
        </div>
        <div className="px-6 py-4">
          <form action={linkFormAction} className="grid gap-3 lg:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_auto]">
            <input type="hidden" name="spaceId" value={spaceId} />
            <input type="hidden" name="workOrderId" value={workOrderId} />
            <input
              name="title"
              type="text"
              disabled={!canUploadDocuments}
              placeholder="Link title"
              className="h-10 rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none disabled:bg-panel-muted"
            />
            <input
              name="url"
              type="url"
              disabled={!canUploadDocuments}
              placeholder="https://example.com"
              className="h-10 rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none disabled:bg-panel-muted"
            />
            <button
              type="submit"
              disabled={!canUploadDocuments}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              <Link2 className="mr-2 h-4 w-4" />
              Add Link
            </button>
          </form>
        </div>
      </div>
      <div className="px-6 pt-4">
        <FormMessage
          message={actionMessage ?? (!canUploadDocuments ? lockedMessage : undefined)}
          tone={actionMessage ? "error" : "info"}
        />
      </div>
      <DocumentItemGrid
        spaceId={spaceId}
        workOrderId={workOrderId}
        folderName={selectedFolder?.name ?? "Documents"}
        selectedFolderKey={selectedFolder?.systemKey ?? "photos"}
        documents={documents}
        canDeleteDocuments={canDeleteDocuments}
        deleteAction={deleteFormAction}
      />
    </section>
  );
}
