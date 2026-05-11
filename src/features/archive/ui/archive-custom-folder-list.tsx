"use client";

import { useMemo, useState } from "react";
import { ChevronRight, FolderClosed, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  /** Tighter block when nested in a space-archive sidebar rail. */
  listStyle?: "default" | "sidebar";
  /** Desktop hover rail: collapse chrome until parent `group/archiveRail` hover or focus-within. */
  archiveRail?: boolean;
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
  listStyle = "default",
  archiveRail = false,
}: ArchiveCustomFolderListProps) {
  const isSidebar = listStyle === "sidebar";
  const railChrome = archiveRail && isSidebar;
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

  function buildHref(folderId: string | null) {
    const searchParams = new URLSearchParams();

    if (spaceId) {
      searchParams.set("space", spaceId);
    }

    if (folderId) {
      searchParams.set("folder", folderId);
    }

    const nextQuery = searchParams.toString();
    return nextQuery ? `${basePath}?${nextQuery}` : basePath;
  }

  return (
    <div
      className={cn(
        isSidebar ? "mt-3 border-t border-border/80 pt-3" : "mt-5 border-t border-border pt-4",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-3 px-2",
          railChrome &&
            "lg:justify-center lg:group-hover/archiveRail:justify-between lg:group-focus-within/archiveRail:justify-between lg:group-data-[archive-rail=expanded]/archiveRail:justify-between",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-3",
            railChrome &&
              "lg:hidden lg:group-hover/archiveRail:flex lg:group-focus-within/archiveRail:flex lg:group-data-[archive-rail=expanded]/archiveRail:flex",
          )}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
            {isSidebar ? "Your folders" : "Custom Folders"}
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
              : "w-9 border-rose-200/80 bg-rose-50 text-rose-600 hover:border-rose-300 hover:bg-rose-100 hover:text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/35 dark:text-rose-400 dark:hover:border-rose-800 dark:hover:bg-rose-950/55 dark:hover:text-rose-300",
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
                  railChrome &&
                    "lg:min-h-[2.75rem] lg:justify-center lg:px-1.5 lg:py-2 lg:group-hover/archiveRail:justify-between lg:group-hover/archiveRail:px-3 lg:group-hover/archiveRail:py-2.5 lg:group-focus-within/archiveRail:justify-between lg:group-focus-within/archiveRail:px-3 lg:group-focus-within/archiveRail:py-2.5 lg:group-data-[archive-rail=expanded]/archiveRail:justify-between lg:group-data-[archive-rail=expanded]/archiveRail:px-3 lg:group-data-[archive-rail=expanded]/archiveRail:py-2.5",
                )}
              >
                <div
                  className={cn(
                    "flex min-w-0 items-center gap-3",
                    railChrome &&
                      "lg:w-full lg:justify-center lg:gap-0 lg:group-hover/archiveRail:w-auto lg:group-hover/archiveRail:justify-start lg:group-hover/archiveRail:gap-3 lg:group-focus-within/archiveRail:w-auto lg:group-focus-within/archiveRail:justify-start lg:group-focus-within/archiveRail:gap-3 lg:group-data-[archive-rail=expanded]/archiveRail:w-auto lg:group-data-[archive-rail=expanded]/archiveRail:justify-start lg:group-data-[archive-rail=expanded]/archiveRail:gap-3",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedFolderIdForDelete === folder.id}
                    onChange={(event) =>
                      setSelectedFolderIdForDelete(event.target.checked ? folder.id : null)
                    }
                    className={cn(
                      "h-4 w-4 rounded border-border",
                      railChrome &&
                        "lg:hidden lg:group-hover/archiveRail:block lg:group-focus-within/archiveRail:block lg:group-data-[archive-rail=expanded]/archiveRail:block",
                    )}
                  />
                  {treeGuides.length > 0 ? (
                    <span
                      className={cn(
                        railChrome &&
                          "lg:hidden lg:group-hover/archiveRail:contents lg:group-focus-within/archiveRail:contents lg:group-data-[archive-rail=expanded]/archiveRail:contents",
                      )}
                    >
                      <ArchiveFolderTreeGuides guides={treeGuides} isBranchEnd={isBranchEnd} />
                    </span>
                  ) : (
                    <ArchiveFolderTreeGuides guides={treeGuides} isBranchEnd={isBranchEnd} />
                  )}
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
                      className={cn(
                        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:text-slate-900",
                        railChrome &&
                          "lg:hidden lg:group-hover/archiveRail:inline-flex lg:group-focus-within/archiveRail:inline-flex lg:group-data-[archive-rail=expanded]/archiveRail:inline-flex",
                      )}
                    >
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 transition-transform",
                          effectiveCollapsedFolderIds.has(folder.id) ? "rotate-0" : "rotate-90",
                        )}
                      />
                    </button>
                  ) : (
                    <span
                      className={cn(
                        "block w-7 shrink-0",
                        railChrome &&
                          "lg:hidden lg:group-hover/archiveRail:block lg:group-focus-within/archiveRail:block lg:group-data-[archive-rail=expanded]/archiveRail:block",
                      )}
                      aria-hidden="true"
                    />
                  )}
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600",
                      railChrome &&
                        "lg:mx-auto lg:group-hover/archiveRail:mx-0 lg:group-focus-within/archiveRail:mx-0 lg:group-data-[archive-rail=expanded]/archiveRail:mx-0",
                    )}
                  >
                    <FolderClosed className="h-4 w-4" />
                  </div>
                  <p
                    className={cn(
                      "truncate text-sm font-medium",
                      railChrome &&
                        "lg:hidden lg:max-w-0 lg:overflow-hidden lg:opacity-0 lg:transition-opacity lg:duration-200 lg:group-hover/archiveRail:block lg:group-hover/archiveRail:max-w-none lg:group-hover/archiveRail:opacity-100 lg:group-focus-within/archiveRail:block lg:group-focus-within/archiveRail:max-w-none lg:group-focus-within/archiveRail:opacity-100 lg:group-data-[archive-rail=expanded]/archiveRail:block lg:group-data-[archive-rail=expanded]/archiveRail:max-w-none lg:group-data-[archive-rail=expanded]/archiveRail:opacity-100",
                    )}
                  >
                    {folder.name}
                  </p>
                </div>

                <span
                  className={cn(
                    "ml-3 inline-flex min-w-8 items-center justify-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600",
                    railChrome &&
                      "lg:ml-0 lg:hidden lg:group-hover/archiveRail:ml-3 lg:group-hover/archiveRail:inline-flex lg:group-focus-within/archiveRail:ml-3 lg:group-focus-within/archiveRail:inline-flex lg:group-data-[archive-rail=expanded]/archiveRail:ml-3 lg:group-data-[archive-rail=expanded]/archiveRail:inline-flex",
                  )}
                >
                  {folder.archivedCount}
                </span>
              </label>
            ) : (
              <ArchiveFolderNavItem
                key={folder.id}
                label={folder.name}
                count={folder.archivedCount}
                href={buildHref(folder.id)}
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
                archiveRail={archiveRail}
              />
            ),
          )
        ) : (
          <div
            className={cn(
              "rounded-xl border border-dashed border-border bg-white px-4 py-4",
              railChrome &&
                "lg:hidden lg:group-hover/archiveRail:block lg:group-focus-within/archiveRail:block lg:group-data-[archive-rail=expanded]/archiveRail:block",
            )}
          >
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
            <input type="hidden" name="returnTo" value={buildHref(selectedFolderId)} />
            <input type="hidden" name="spaceId" value={spaceId ?? ""} />
            {selectedFolder.archivedCount > 0 ? (
              <input type="hidden" name="forceMoveContents" value="true" />
            ) : null}

            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-4">
              <p className="text-sm font-semibold text-rose-700">{selectedFolder.name}</p>
              <p className="mt-2 text-sm leading-6 text-rose-600">
                Are you sure you want to delete this folder?
              </p>
              <p className="mt-2 text-sm leading-6 text-rose-600">
                Archived work orders inside this folder will be moved to Unsorted Archive so their data is preserved.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
              <Button type="button" variant="secondary" onClick={handleCloseModal}>
                Cancel
              </Button>
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-4 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-100"
              >
                Delete folder
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
