"use client";

import { useMemo, useState } from "react";
import { ChevronRight, FolderClosed, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { deleteArchiveFolderAction } from "@/features/archive/actions/archive.actions";
import {
  ArchiveFolderNavItem,
  ArchiveFolderTreeGuides,
} from "@/features/archive/ui/archive-folder-nav-item";
import type { ArchiveFolder } from "@/features/archive/types/archive";
import { cn } from "@/lib/utils";

type ArchiveCustomFolderListProps = Readonly<{
  folders: ArchiveFolder[];
  selectedFolderId: string | null;
  basePath?: string;
  spaceId?: string | null;
}>;

type ArchiveFolderTreeRow = Readonly<{
  folder: ArchiveFolder;
  treeGuides: boolean[];
  isBranchEnd: boolean;
  hasChildren: boolean;
}>;

export function ArchiveCustomFolderList({
  folders,
  selectedFolderId,
  basePath = "/archive",
  spaceId = null,
}: ArchiveCustomFolderListProps) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedFolderIdForDelete, setSelectedFolderIdForDelete] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [collapsedFolderIds, setCollapsedFolderIds] = useState<Set<string>>(new Set());
  const selectedFolder = useMemo(
    () => folders.find((folder) => folder.id === selectedFolderIdForDelete) ?? null,
    [folders, selectedFolderIdForDelete],
  );
  const folderById = useMemo(
    () => new Map(folders.map((folder) => [folder.id, folder])),
    [folders],
  );
  const childrenByParent = useMemo(() => {
    const nextChildrenByParent = new Map<string | null, ArchiveFolder[]>();

    for (const folder of folders) {
      const normalizedParentId =
        folder.parentId && folderById.has(folder.parentId) ? folder.parentId : null;
      const siblings = nextChildrenByParent.get(normalizedParentId) ?? [];

      siblings.push(folder);
      nextChildrenByParent.set(normalizedParentId, siblings);
    }

    return nextChildrenByParent;
  }, [folderById, folders]);
  const allExpandableFolderIds = useMemo(
    () =>
      folders
        .filter((folder) => (childrenByParent.get(folder.id)?.length ?? 0) > 0)
        .map((folder) => folder.id),
    [childrenByParent, folders],
  );
  const effectiveCollapsedFolderIds = useMemo(() => {
    const next = new Set<string>();

    for (const folderId of collapsedFolderIds) {
      if (allExpandableFolderIds.includes(folderId)) {
        next.add(folderId);
      }
    }

    return next;
  }, [allExpandableFolderIds, collapsedFolderIds]);
  const treeRows = useMemo<ArchiveFolderTreeRow[]>(() => {
    const rows: ArchiveFolderTreeRow[] = [];

    function visit(parentId: string | null, ancestorGuideState: boolean[]) {
      const children = childrenByParent.get(parentId) ?? [];

      children.forEach((folder, index) => {
        const isBranchEnd = index === children.length - 1;
        const hasChildren = (childrenByParent.get(folder.id)?.length ?? 0) > 0;

        rows.push({
          folder,
          treeGuides: ancestorGuideState,
          isBranchEnd,
          hasChildren,
        });

        if (!effectiveCollapsedFolderIds.has(folder.id)) {
          visit(folder.id, [...ancestorGuideState, !isBranchEnd]);
        }
      });
    }

    visit(null, []);
    return rows;
  }, [childrenByParent, effectiveCollapsedFolderIds]);

  function toggleFolderCollapse(folderId: string) {
    setCollapsedFolderIds((current) => {
      const next = new Set(current);

      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }

      return next;
    });
  }

  function handleToggleSelectionMode() {
    setSelectionMode((current) => {
      if (current) {
        setSelectedFolderIdForDelete(null);
      }

      return !current;
    });
  }

  function handleDeleteClick() {
    if (!selectedFolderIdForDelete) {
      return;
    }

    setIsConfirmOpen(true);
  }

  function handleCloseModal() {
    setIsConfirmOpen(false);
  }

  return (
    <div className="mt-5 border-t border-border pt-4">
      <div className="flex items-center justify-between gap-3 px-2">
        <div className="flex items-center gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
            Custom Folders
          </p>
          <span className="rounded-full border border-border bg-white px-2.5 py-1 text-[11px] font-semibold text-muted">
            {folders.length}
          </span>
        </div>

        <button
          type="button"
          onClick={selectedFolderIdForDelete ? handleDeleteClick : handleToggleSelectionMode}
          className={cn(
            "inline-flex h-9 items-center justify-center rounded-xl border px-3 text-sm font-medium transition-colors",
            selectedFolderIdForDelete
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "w-9 border-border bg-white text-muted hover:text-foreground",
          )}
          aria-label={selectedFolderIdForDelete ? "Delete selected folder" : "Select a folder to delete"}
        >
          {selectedFolderIdForDelete ? (
            "Delete"
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className="mt-3 space-y-2">
        {treeRows.length > 0 ? (
          treeRows.map(({ folder, treeGuides, isBranchEnd, hasChildren }) =>
            selectionMode ? (
              <label
                key={folder.id}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2.5 transition-colors",
                  selectedFolderIdForDelete === folder.id
                    ? "border-slate-300 bg-white text-slate-950 shadow-[0_4px_12px_rgba(15,23,42,0.04)]"
                    : "border-transparent bg-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-950",
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedFolderIdForDelete === folder.id}
                    onChange={(event) =>
                      setSelectedFolderIdForDelete(event.target.checked ? folder.id : null)
                    }
                    className="h-4 w-4 rounded border-border"
                  />
                  <ArchiveFolderTreeGuides guides={treeGuides} isBranchEnd={isBranchEnd} />
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        toggleFolderCollapse(folder.id);
                      }}
                      aria-label={
                        effectiveCollapsedFolderIds.has(folder.id)
                          ? `Expand ${folder.name}`
                          : `Collapse ${folder.name}`
                      }
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:text-slate-900"
                    >
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 transition-transform",
                          effectiveCollapsedFolderIds.has(folder.id) ? "rotate-0" : "rotate-90",
                        )}
                      />
                    </button>
                  ) : (
                    <span className="block w-7 shrink-0" aria-hidden="true" />
                  )}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600">
                    <FolderClosed className="h-4 w-4" />
                  </div>
                  <p className="truncate text-sm font-medium">{folder.name}</p>
                </div>

                <span className="ml-3 inline-flex min-w-8 items-center justify-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {folder.archivedCount}
                </span>
              </label>
            ) : (
              <ArchiveFolderNavItem
                key={folder.id}
                label={folder.name}
                count={folder.archivedCount}
                href={`${basePath}?folder=${folder.id}`}
                icon={FolderClosed}
                depth={folder.depth}
                treeGuides={treeGuides}
                isBranchEnd={isBranchEnd}
                toggleButton={
                  hasChildren
                    ? {
                        isExpanded: !effectiveCollapsedFolderIds.has(folder.id),
                        onToggle: () => toggleFolderCollapse(folder.id),
                        ariaLabel: effectiveCollapsedFolderIds.has(folder.id)
                          ? `Expand ${folder.name}`
                          : `Collapse ${folder.name}`,
                      }
                    : null
                }
                isActive={selectedFolderId === folder.id}
              />
            ),
          )
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-white px-4 py-4">
            <p className="text-sm text-muted">No custom folders yet.</p>
          </div>
        )}
      </div>

      {selectedFolder ? (
        <Modal
          open={isConfirmOpen}
          onClose={handleCloseModal}
          title="Delete Custom Folder"
          description="Please confirm before removing this archive folder."
        >
          <form action={deleteArchiveFolderAction} className="space-y-4 px-5 py-4">
            <input type="hidden" name="folderId" value={selectedFolder.id} />
            <input type="hidden" name="returnTo" value={basePath} />
            <input type="hidden" name="spaceId" value={spaceId ?? ""} />
            {selectedFolder.archivedCount > 0 ? (
              <input type="hidden" name="forceMoveContents" value="true" />
            ) : null}

            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4">
              <p className="text-sm font-semibold text-rose-700">{selectedFolder.name}</p>
              <p className="mt-2 text-sm leading-6 text-rose-600">
                Are you sure you want to delete this folder?
              </p>
              <p className="mt-2 text-sm leading-6 text-rose-600">
                Archived work orders inside this folder will be moved to Unsorted Archive so their data is preserved.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
              <button
                type="button"
                onClick={handleCloseModal}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-panel px-4 text-sm font-medium text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700"
              >
                Delete Folder
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
