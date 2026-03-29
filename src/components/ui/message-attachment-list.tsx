"use client";

import Image from "next/image";
import { FileText, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MessageAttachment } from "@/types/message";

type MessageAttachmentListProps = Readonly<{
  attachments: MessageAttachment[];
  isCurrentUser: boolean;
}>;

function formatFileSize(value: number | null) {
  if (!value) {
    return "Unknown size";
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${Math.round(value / 1024)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function MessageAttachmentList({
  attachments,
  isCurrentUser,
}: MessageAttachmentListProps) {
  return (
    <div className="mt-3 space-y-2">
      {attachments.map((attachment) => (
        <a
          key={attachment.id}
          href={attachment.downloadUrl ?? undefined}
          target="_blank"
          rel="noreferrer"
          className={cn(
            "block overflow-hidden rounded-xl border",
            isCurrentUser
              ? "border-slate-700 bg-slate-800 text-slate-100"
              : "border-border bg-panel-muted",
          )}
        >
          {attachment.isImage && attachment.previewUrl ? (
            <Image
              src={attachment.previewUrl}
              alt={attachment.fileName}
              width={720}
              height={288}
              unoptimized
              className="h-36 w-full object-cover"
            />
          ) : null}
          <div className="flex items-center gap-3 px-3 py-3 text-xs">
            <span
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-lg",
                isCurrentUser ? "bg-slate-700" : "bg-white",
              )}
            >
              {attachment.isImage ? (
                <ImageIcon className="h-4 w-4" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
            </span>
            <div className="min-w-0">
              <p
                className={cn(
                  "truncate font-medium",
                  isCurrentUser ? "text-slate-100" : "text-foreground",
                )}
              >
                {attachment.fileName}
              </p>
              <p className={cn(isCurrentUser ? "text-slate-300" : "text-muted")}>
                {formatFileSize(attachment.fileSizeBytes)}
              </p>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
