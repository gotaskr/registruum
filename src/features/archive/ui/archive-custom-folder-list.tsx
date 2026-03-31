"use client";

import { useMemo, useState } from "react";
import { FolderClosed, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { deleteArchiveFolderAction } from "@/features/archive/actions/archive.actions";
import { ArchiveFolderNavItem } from "@/features/archive/ui/archive-folder-nav-item";
import type { ArchiveFolder } from "@/features/archive/types/archive";
import { cn } from "@/lib/utils";

type ArchiveCustomFolderListProps = Readonly<{
  folders: ArchiveFolder[];
  selectedFolderId: string | null;
}>;

export function ArchiveCustomFolderList({
  folders,
  selectedFolderId,
}: ArchiveCustomFolderListProps) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedFolderIdForDelete, setSelectedFolderIdForDelete] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const selectedFolder = useMemo(
    () => folders.find((folder) => folder.id === selectedFolderIdForDelete) ?? null,
    [folders, selectedFolderIdForDelete],
  );

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
        {folders.length > 0 ? (
          folders.map((folder) =>
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
                href={`/archive?folder=${folder.id}`}
                icon={FolderClosed}
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
            <input type="hidden" name="returnTo" value="/archive" />
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
