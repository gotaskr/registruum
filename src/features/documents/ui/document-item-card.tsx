"use client";

import Image from "next/image";
import { ExternalLink, FileText, Link2, Trash2, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkOrderDocumentRecord } from "@/features/documents/types/document-browser";

type DocumentItemCardProps = Readonly<{
  document: WorkOrderDocumentRecord;
  spaceId: string;
  workOrderId: string;
  canDeleteDocuments: boolean;
  deleteAction: (payload: FormData) => void;
}>;

function formatFileSize(value: number | null) {
  if (!value) {
    return "No size";
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${Math.round(value / 1024)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function getItemMeta(document: WorkOrderDocumentRecord) {
  const sourceLabel = document.source === "chat" ? "Saved from chat" : "Added manually";

  if (document.kind === "link") {
    return `${sourceLabel} / ${document.sentAt}`;
  }

  return `${formatFileSize(document.fileSizeBytes)} / ${sourceLabel}`;
}

export function DocumentItemCard({
  document,
  spaceId,
  workOrderId,
  canDeleteDocuments,
  deleteAction,
}: DocumentItemCardProps) {
  const href = document.kind === "link" ? document.externalUrl : document.downloadUrl;

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-panel">
      {document.kind === "photo" && document.previewUrl ? (
        <a href={href ?? undefined} target="_blank" rel="noreferrer">
          <Image
            src={document.previewUrl}
            alt={document.title}
            width={720}
            height={360}
            unoptimized
            className="h-40 w-full object-cover"
          />
        </a>
      ) : (
        <div className="flex h-32 items-center justify-center border-b border-border bg-panel-muted">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-panel text-foreground">
            {document.kind === "video" ? (
              <Video className="h-5 w-5" />
            ) : document.kind === "link" ? (
              <Link2 className="h-5 w-5" />
            ) : (
              <FileText className="h-5 w-5" />
            )}
          </span>
        </div>
      )}
      <div className="space-y-3 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{document.title}</p>
            <p className="mt-1 text-xs text-muted">{getItemMeta(document)}</p>
          </div>
          <div className="flex items-center gap-2">
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:text-foreground"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : null}
            {canDeleteDocuments ? (
              <form action={deleteAction}>
                <input type="hidden" name="spaceId" value={spaceId} />
                <input type="hidden" name="workOrderId" value={workOrderId} />
                <input type="hidden" name="documentId" value={document.id} />
                <button
                  type="submit"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:text-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </form>
            ) : null}
          </div>
        </div>
        <div className="space-y-1 text-xs text-muted">
          <p className="truncate">{document.kind === "link" ? document.externalUrl : document.fileName}</p>
          <p className={cn(document.source === "chat" ? "text-foreground" : "text-muted")}>
            {document.uploadedByName} / {document.sentAt}
          </p>
        </div>
      </div>
    </article>
  );
}
