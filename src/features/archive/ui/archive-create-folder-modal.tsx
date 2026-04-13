"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { createArchiveFolderAction } from "@/features/archive/actions/archive.actions";
import {
  archiveControlClass,
  archiveLabelClass,
} from "@/features/archive/lib/archive-form-styles";
import { formatArchiveFolderOptionLabel } from "@/features/archive/lib/archive-folder-tree";
import type { ArchiveFolderOption } from "@/features/archive/types/archive";

type ArchiveCreateFolderModalProps = Readonly<{
  returnTo: string;
  folders: ArchiveFolderOption[];
  defaultParentFolderId?: string | null;
  spaceId?: string | null;
  disabled?: boolean;
  /** Override trigger button layout (e.g. compact row next to folder select on mobile). */
  triggerClassName?: string;
}>;

export function ArchiveCreateFolderModal({
  returnTo,
  folders,
  defaultParentFolderId = null,
  spaceId = null,
  disabled = false,
  triggerClassName,
}: ArchiveCreateFolderModalProps) {
  const [open, setOpen] = useState(false);

  function handleClose() {
    setOpen(false);
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={triggerClassName ?? "h-10 w-full touch-manipulation"}
      >
        Add folder
      </Button>

      <Modal
        open={open}
        onClose={handleClose}
        title="Create Archive Folder"
        description="Add a folder or subfolder to organize archived work orders."
      >
        <form action={createArchiveFolderAction} className="space-y-3 px-4 py-4">
          <input type="hidden" name="returnTo" value={returnTo} />
          <input type="hidden" name="spaceId" value={spaceId ?? ""} />

          <label className="grid gap-1.5">
            <span className={archiveLabelClass}>Folder name</span>
            <input
              name="name"
              type="text"
              placeholder="Folder name"
              autoFocus
              className={archiveControlClass}
            />
          </label>

          <label className="grid gap-1.5">
            <span className={archiveLabelClass}>Parent folder</span>
            <select
              name="parentFolderId"
              defaultValue={defaultParentFolderId ?? ""}
              className={archiveControlClass}
            >
              <option value="">Top level</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {formatArchiveFolderOptionLabel(folder)}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col-reverse gap-2 border-t border-border pt-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" className="w-full sm:w-auto">
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
