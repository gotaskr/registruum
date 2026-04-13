"use client";

import { DocumentItemCard } from "@/features/documents/ui/document-item-card";
import type {
  SystemDocumentFolderKey,
  WorkOrderDocumentRecord,
} from "@/features/documents/types/document-browser";

type DocumentItemGridProps = Readonly<{
  spaceId: string;
  workOrderId: string;
  folderName: string;
  selectedFolderKey: SystemDocumentFolderKey;
  documents: WorkOrderDocumentRecord[];
  canDeleteDocuments: boolean;
  deleteAction: (payload: FormData) => void;
}>;

export function DocumentItemGrid({
  spaceId,
  workOrderId,
  folderName,
  selectedFolderKey,
  documents,
  canDeleteDocuments,
  deleteAction,
}: DocumentItemGridProps) {
  const visibleDocuments = documents.filter(
    (document) => document.systemFolderKey === selectedFolderKey,
  );

  if (visibleDocuments.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm leading-relaxed text-slate-600 sm:px-6 dark:text-slate-300">
        No items in {folderName} yet. Files sent in chat and documents added here will appear in
        this folder automatically.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-6 md:grid-cols-2 xl:grid-cols-3">
      {visibleDocuments.map((document) => (
        <DocumentItemCard
          key={document.id}
          document={document}
          spaceId={spaceId}
          workOrderId={workOrderId}
          canDeleteDocuments={canDeleteDocuments}
          deleteAction={deleteAction}
        />
      ))}
    </div>
  );
}
