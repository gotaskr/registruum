"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Download, ExternalLink, FolderInput, MoreHorizontal } from "lucide-react";
import { moveArchivedWorkOrderAction } from "@/features/archive/actions/archive.actions";
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
    <div className="relative flex items-center gap-2" ref={menuRef}>
      <Link
        href={item.viewHref}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-panel px-3 text-sm font-medium text-foreground"
      >
        View
      </Link>

      <button
        type="button"
        onClick={() => setMenuOpen((current) => !current)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-panel text-muted transition-colors hover:text-foreground"
        aria-label="Open archive record actions"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {menuOpen ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-72 rounded-2xl border border-border bg-panel p-2 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          <Link
            href={item.viewHref}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground transition-colors hover:bg-panel-muted"
          >
            <ExternalLink className="h-4 w-4" />
            View archived record
          </Link>

          <div className="mt-2 border-t border-border px-3 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
              Move To Folder
            </p>
            <form action={moveArchivedWorkOrderAction} className="mt-3 grid gap-2">
              <input type="hidden" name="archivedWorkOrderId" value={item.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <select
                name="targetFolderId"
                value={targetFolderId}
                onChange={(event) => setTargetFolderId(event.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-panel px-3 text-sm text-foreground outline-none"
              >
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {formatArchiveFolderOptionLabel(folder)}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={targetFolderId === item.folderId}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FolderInput className="h-4 w-4" />
                Move
              </button>
            </form>
          </div>

          <div className="mt-1 border-t border-border pt-2">
            <a
              href={`/api/archive/${item.id}/export`}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-panel-muted"
            >
              <Download className="h-4 w-4" />
              Export audit workbook
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
