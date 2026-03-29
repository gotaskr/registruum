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
      <div className="px-6 py-8 text-sm text-muted">
        No items in {folderName} yet. Files sent in chat and documents added here will appear in
        this folder automatically.
      </div>
    );
  }

  return (
    <div className="grid gap-4 px-6 py-6 md:grid-cols-2 xl:grid-cols-3">
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
