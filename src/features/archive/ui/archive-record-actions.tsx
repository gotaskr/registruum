"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Download, ExternalLink, FolderInput, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { moveArchivedWorkOrderAction } from "@/features/archive/actions/archive.actions";
import { archiveControlClass } from "@/features/archive/lib/archive-form-styles";
import { cn } from "@/lib/utils";
import { formatArchiveFolderOptionLabel } from "@/features/archive/lib/archive-folder-tree";
import type { ArchiveFolderOption, ArchivedWorkOrderItem } from "@/features/archive/types/archive";

type ArchiveRecordActionsProps = Readonly<{
  item: ArchivedWorkOrderItem;
  folders: ArchiveFolderOption[];
  returnTo: string;
}>;

export function ArchiveRecordActions({
  item,
  folders,
  returnTo,
}: ArchiveRecordActionsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [targetFolderId, setTargetFolderId] = useState(item.folderId);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [menuOpen]);

  return (
    <div
      className={cn(
        "relative flex items-center gap-2",
        "max-sm:w-full max-sm:justify-between",
      )}
      ref={menuRef}
    >
      <Link
        href={item.viewHref}
        target="_blank"
        rel="noreferrer"
        className={cn(
          "inline-flex h-10 min-w-0 flex-1 items-center justify-center rounded-xl border border-border bg-panel px-3 text-sm font-medium text-foreground transition-colors hover:bg-panel-muted sm:flex-initial",
        )}
      >
        View
      </Link>

      <button
        type="button"
        onClick={() => setMenuOpen((current) => !current)}
        className="inline-flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center rounded-lg border border-border bg-panel text-muted transition-colors hover:bg-panel-muted hover:text-foreground"
        aria-label="Open archive record actions"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {menuOpen ? (
        <div className="absolute right-0 top-[calc(100%+0.35rem)] z-30 w-[min(100vw-2rem,18rem)] rounded-lg border border-border bg-panel p-1.5 shadow-sm">
          <Link
            href={item.viewHref}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-foreground hover:bg-panel-muted"
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            Open record
          </Link>

          {folders.length > 0 ? (
            <div className="mt-1 border-t border-border pt-2">
              <p className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
                Move to folder
              </p>
              <form action={moveArchivedWorkOrderAction} className="grid gap-2 px-0.5">
                <input type="hidden" name="archivedWorkOrderId" value={item.id} />
                <input type="hidden" name="spaceId" value={item.spaceId} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <select
                  name="targetFolderId"
                  value={targetFolderId}
                  onChange={(event) => setTargetFolderId(event.target.value)}
                  className={archiveControlClass}
                  aria-label="Destination folder"
                >
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {formatArchiveFolderOptionLabel(folder)}
                    </option>
                  ))}
                </select>
                <Button
                  type="submit"
                  variant="brand"
                  disabled={targetFolderId === item.folderId}
                  className="h-10 w-full gap-1.5 text-sm"
                >
                  <FolderInput className="h-4 w-4" />
                  Move
                </Button>
              </form>
            </div>
          ) : null}

          <div className="mt-1 border-t border-border pt-1">
            <a
              href={`/api/archive/${item.id}/export`}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-foreground hover:bg-panel-muted"
            >
              <Download className="h-4 w-4 shrink-0" />
              Export workbook
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
