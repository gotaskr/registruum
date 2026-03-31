"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { createArchiveFolderAction } from "@/features/archive/actions/archive.actions";

type ArchiveCreateFolderModalProps = Readonly<{
  returnTo: string;
}>;

export function ArchiveCreateFolderModal({
  returnTo,
}: ArchiveCreateFolderModalProps) {
  const [open, setOpen] = useState(false);

  function handleClose() {
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white"
      >
        Add Folder
      </button>

      <Modal
        open={open}
        onClose={handleClose}
        title="Create Archive Folder"
        description="Add a folder to organize archived work orders."
      >
        <form action={createArchiveFolderAction} className="space-y-4 px-5 py-4">
          <input type="hidden" name="returnTo" value={returnTo} />

          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">Folder Name</span>
            <input
              name="name"
              type="text"
              placeholder="Folder name"
              autoFocus
              className="h-11 w-full rounded-xl border border-border bg-panel px-3 text-sm text-foreground outline-none"
            />
          </label>

          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-panel px-4 text-sm font-medium text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white"
            >
              Create Folder
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
