"use client";

import { useActionState, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUploadField } from "@/components/ui/file-upload-field";
import { FormMessage } from "@/features/auth/ui/form-message";
import { deleteDocumentItem, uploadWorkOrderDocuments } from "@/features/documents/actions/document.actions";
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
  const [deleteState, deleteFormAction] = useActionState(
    deleteDocumentItem,
    initialDocumentActionState,
  );
  const selectedFolder = folders.find((folder) => folder.systemKey === selectedFolderKey) ?? folders[0];
  const actionMessage = uploadState.error ?? deleteState.error;

  return (
    <section className="min-h-0">
      <DocumentFolderList
        folders={folders}
        selectedFolderKey={selectedFolderKey}
        onSelect={setSelectedFolderKey}
      />
      <div className="border-b border-border px-4 py-2.5 sm:px-5 lg:px-6 lg:py-4">
        <form action={uploadFormAction} className="space-y-2 lg:space-y-4">
          <input type="hidden" name="spaceId" value={spaceId} />
          <input type="hidden" name="workOrderId" value={workOrderId} />
          <FileUploadField
            name="files"
            buttonLabel="Select files"
            helperText="Photos, videos, and files are sorted into system folders automatically."
            helperTextClassName="hidden text-slate-600 dark:text-slate-400 lg:block"
            disabled={!canUploadDocuments}
            accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.txt,.mp4,.mov,.webm,.avi,.mkv"
            onFilesChange={setSelectedFileCount}
            buttonClassName="h-10 min-h-10 w-full justify-center touch-manipulation max-lg:rounded-xl sm:w-auto sm:justify-start lg:min-h-11"
          />
          <Button
            type="submit"
            variant="brand"
            disabled={!canUploadDocuments || selectedFileCount === 0}
            className="h-10 w-full touch-manipulation max-lg:text-sm max-lg:font-semibold lg:h-11 lg:w-auto"
          >
            <Upload className="mr-2 h-4 w-4 shrink-0" />
            <span className="lg:hidden">Upload</span>
            <span className="hidden lg:inline">Upload to Documents</span>
          </Button>
        </form>
      </div>
      <div className="px-4 pt-2 sm:px-5 sm:pt-3 lg:px-6 lg:pt-4">
        <FormMessage
          message={actionMessage ?? (!canUploadDocuments ? lockedMessage : undefined)}
          tone={actionMessage ? "error" : "info"}
          className="text-xs sm:text-sm"
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
