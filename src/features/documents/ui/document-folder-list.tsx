"use client";

import { FileText, ImageIcon, Link2, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  SystemDocumentFolderKey,
  WorkOrderDocumentFolder,
} from "@/features/documents/types/document-browser";

type DocumentFolderListProps = Readonly<{
  folders: WorkOrderDocumentFolder[];
  selectedFolderKey: SystemDocumentFolderKey;
  onSelect: (folderKey: SystemDocumentFolderKey) => void;
}>;

const iconByFolderKey = {
  photos: ImageIcon,
  videos: Video,
  files: FileText,
  links: Link2,
} as const;

export function DocumentFolderList({
  folders,
  selectedFolderKey,
  onSelect,
}: DocumentFolderListProps) {
  return (
    <div className="grid gap-3 border-b border-border px-6 py-4 sm:grid-cols-2 xl:grid-cols-4">
      {folders.map((folder) => {
        const Icon = iconByFolderKey[folder.systemKey];

        return (
          <button
            key={folder.id}
            type="button"
            onClick={() => onSelect(folder.systemKey)}
            className={cn(
              "flex items-center justify-between rounded-xl border px-4 py-4 text-left",
              selectedFolderKey === folder.systemKey
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-border bg-panel hover:bg-panel-muted",
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-lg",
                  selectedFolderKey === folder.systemKey
                    ? "bg-slate-800 text-white"
                    : "bg-panel-muted text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium">{folder.name}</p>
                <p
                  className={cn(
                    "mt-1 text-xs",
                    selectedFolderKey === folder.systemKey
                      ? "text-slate-300"
                      : "text-muted",
                  )}
                >
                  System folder
                </p>
              </div>
            </div>
            <span
              className={cn(
                "text-sm font-semibold",
                selectedFolderKey === folder.systemKey ? "text-white" : "text-foreground",
              )}
            >
              {folder.itemCount}
            </span>
          </button>
        );
      })}
    </div>
  );
}
