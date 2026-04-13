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
    <>
      {/* Mobile: single horizontal strip — no “System folder”, less vertical space */}
      <div className="border-b border-border lg:hidden">
        <div
          className="flex gap-2 overflow-x-auto px-4 py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Document folders"
        >
          {folders.map((folder) => {
            const Icon = iconByFolderKey[folder.systemKey];
            const selected = selectedFolderKey === folder.systemKey;

            return (
              <button
                key={folder.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => onSelect(folder.systemKey)}
                className={cn(
                  "flex shrink-0 snap-start touch-manipulation items-center gap-2 rounded-full border px-3 py-2 transition-colors",
                  selected
                    ? "border-[#2f5fd4] bg-[#2f5fd4] text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-900 active:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:active:bg-slate-700/80",
                )}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-95" aria-hidden />
                <span className="text-sm font-semibold">{folder.name}</span>
                <span
                  className={cn(
                    "min-w-[1.25rem] rounded-md px-1.5 py-0.5 text-center text-[11px] font-bold tabular-nums",
                    selected
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100",
                  )}
                >
                  {folder.itemCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop / large tablet: card grid */}
      <div className="hidden grid-cols-2 gap-3 border-b border-border px-6 py-4 lg:grid xl:grid-cols-4">
        {folders.map((folder) => {
          const Icon = iconByFolderKey[folder.systemKey];

          return (
            <button
              key={folder.id}
              type="button"
              onClick={() => onSelect(folder.systemKey)}
              className={cn(
                "flex items-center justify-between rounded-xl border px-4 py-4 text-left transition-colors",
                selectedFolderKey === folder.systemKey
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-border bg-panel hover:bg-panel-muted",
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={cn(
                    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    selectedFolderKey === folder.systemKey
                      ? "bg-slate-800 text-white"
                      : "bg-panel-muted text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{folder.name}</p>
                  <p
                    className={cn(
                      "mt-1 text-xs",
                      selectedFolderKey === folder.systemKey
                        ? "text-slate-300"
                        : "text-slate-600 dark:text-slate-400",
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
    </>
  );
}
