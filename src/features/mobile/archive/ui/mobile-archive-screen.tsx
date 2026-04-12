"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { createArchiveFolderAction } from "@/features/archive/actions/archive.actions";
import {
  buildArchiveFolderTreeMetadata,
  formatArchiveFolderOptionLabel,
} from "@/features/archive/lib/archive-folder-tree";
import { getMobileArchiveRecordHref } from "@/features/mobile/lib/routes";
import type { MobileArchiveData } from "@/features/mobile/types/mobile";
import { MobileBottomSheet } from "@/features/mobile/ui/mobile-bottom-sheet";
import { MobileCard, MobileStatusPill } from "@/features/mobile/ui/mobile-primitives";
import { MobileShell } from "@/features/mobile/ui/mobile-shell";

function sortItems(
  items: MobileArchiveData["items"],
  sort: MobileArchiveData["sort"],
) {
  return [...items].sort((left, right) => {
    switch (sort) {
      case "archived_asc":
        return left.archivedAt.localeCompare(right.archivedAt);
      case "title_asc":
        return left.title.localeCompare(right.title);
      case "title_desc":
        return right.title.localeCompare(left.title);
      case "archived_desc":
      default:
        return right.archivedAt.localeCompare(left.archivedAt);
    }
  });
}

export function MobileArchiveScreen({
  data,
}: Readonly<{
  data: MobileArchiveData;
}>) {
  const [query, setQuery] = useState(data.searchQuery);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(data.selectedFolderId);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const selectedFolderIds = useMemo(() => {
    if (!selectedFolderId) {
      return null;
    }

    const folderTree = buildArchiveFolderTreeMetadata(
      data.folders.map((folder) => ({
        id: folder.id,
        name: folder.name,
        parentId: folder.parentId,
        isSystemDefault: folder.isSystemDefault,
      })),
    );

    return new Set(folderTree.descendantIdsById.get(selectedFolderId) ?? [selectedFolderId]);
  }, [data.folders, selectedFolderId]);

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return sortItems(
      data.items
        .filter((item) => (selectedFolderIds ? selectedFolderIds.has(item.folderId) : true))
        .filter((item) =>
          normalizedQuery.length > 0
            ? [item.title, item.spaceName, item.folderName]
                .join(" ")
                .toLowerCase()
                .includes(normalizedQuery)
            : true,
        ),
      data.sort,
    );
  }, [data.items, data.sort, query, selectedFolderIds]);
  const canManageFolders = Boolean(data.selectedSpaceId);

  return (
    <MobileShell>
      <div className="mobile-screen-bg space-y-5 px-4 py-4">
        <section className="mobile-hero-surface px-5 py-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-[2rem] font-semibold tracking-[-0.05em] text-slate-950">Archive</h1>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Read-only records organized by folder.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCreateFolderOpen(true)}
              disabled={!canManageFolders}
              className="mobile-secondary-button inline-flex h-12 shrink-0 items-center gap-2 px-4 text-[1rem] font-medium text-slate-800"
            >
              <Plus className="h-5 w-5" />
              Folder
            </button>
          </div>
          {!canManageFolders ? (
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Select a space from the desktop archive view before creating mobile folders.
            </p>
          ) : null}

          <label className="relative mt-5 block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search archived orders..."
              className="mobile-input-surface h-14 w-full pl-12 pr-4 text-base text-slate-950 outline-none"
            />
          </label>

          <div className="hide-scrollbar mt-5 -mx-1 overflow-x-auto pb-1">
            <div className="flex min-w-max gap-2 px-1">
              <button
                type="button"
                onClick={() => setSelectedFolderId(null)}
                className={
                  selectedFolderId === null
                    ? "mobile-primary-button inline-flex h-11 shrink-0 items-center px-5 text-[1rem] font-semibold shadow-none"
                      : "inline-flex h-11 shrink-0 items-center rounded-full border border-slate-200 bg-white px-5 text-[1rem] font-medium text-slate-500"
                  }
                >
                  All
                </button>
              {data.folders.map((folder) => (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => setSelectedFolderId(folder.id)}
                  className={
                    selectedFolderId === folder.id
                      ? "mobile-primary-button inline-flex h-11 shrink-0 items-center px-5 text-[1rem] font-semibold shadow-none"
                      : "inline-flex h-11 shrink-0 items-center rounded-full border border-slate-200 bg-white px-5 text-[1rem] font-medium text-slate-500"
                  }
                >
                  {folder.pathLabel}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="space-y-3 pb-2">
          {visibleItems.length > 0 ? (
              visibleItems.map((item) => (
              <MobileCard key={item.id} className="space-y-4 rounded-[28px] bg-[linear-gradient(180deg,#ffffff_0%,#fbfcff_100%)] p-5">
                <div className="space-y-3">
                  <div className="flex flex-col gap-3">
                    <div className="min-w-0">
                      <p className="break-words text-[1.28rem] font-semibold tracking-[-0.03em] text-slate-950">
                        {item.title}
                      </p>
                      <p className="mt-2 text-[1rem] text-slate-500">{item.spaceName}</p>
                    </div>
                    <div>
                      <MobileStatusPill label="Archived" tone="neutral" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[0.98rem] text-slate-500">{item.archivedAtLabel}</p>
                    <p className="text-[0.98rem] text-slate-500">
                      Finalized by {item.archivedByName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <span className="max-w-[58%] truncate rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-600">
                    {item.folderName}
                  </span>
                  <Link
                    href={getMobileArchiveRecordHref(item.id)}
                    className="mobile-primary-button inline-flex h-11 shrink-0 items-center justify-center px-5 text-[1rem] font-semibold active:scale-[0.98]"
                  >
                    View
                  </Link>
                </div>
              </MobileCard>
            ))
          ) : (
            <MobileCard className="rounded-[26px] py-16 text-center">
              <p className="text-[1.6rem] font-semibold text-slate-950">No archived work orders yet</p>
              <p className="mt-2 text-[1.02rem] text-slate-500">
                Completed work orders will appear here automatically.
              </p>
              <p className="mt-1 text-[1.02rem] text-slate-500">
                Use folders to organize records anytime.
              </p>
            </MobileCard>
          )}
        </div>
      </div>

      <MobileBottomSheet
        open={createFolderOpen}
        onClose={() => setCreateFolderOpen(false)}
        title="Create Folder"
        description="Folders organize archived records without changing them."
      >
        <form action={createArchiveFolderAction} className="space-y-4">
          <input type="hidden" name="returnTo" value="/m/archive" />
          <input type="hidden" name="spaceId" value={data.selectedSpaceId ?? ""} />
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Folder Name</span>
            <input
              name="name"
              type="text"
              placeholder="Electrical"
              className="mobile-input-surface h-12 w-full px-4 text-sm text-slate-950 outline-none"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Parent Folder</span>
            <select
              name="parentFolderId"
              defaultValue={selectedFolderId ?? ""}
              className="mobile-input-surface h-12 w-full px-4 text-sm text-slate-950 outline-none"
            >
              <option value="">Top level</option>
              {data.folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {formatArchiveFolderOptionLabel(folder)}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setCreateFolderOpen(false)}
              className="mobile-secondary-button inline-flex h-12 flex-1 items-center justify-center text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canManageFolders}
              className="mobile-primary-button inline-flex h-12 flex-1 items-center justify-center text-sm font-semibold"
            >
              Create Folder
            </button>
          </div>
        </form>
      </MobileBottomSheet>
    </MobileShell>
  );
}
