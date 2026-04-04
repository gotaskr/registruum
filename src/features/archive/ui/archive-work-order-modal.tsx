"use client";

import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { FormMessage } from "@/features/auth/ui/form-message";
import { archiveWorkOrderRecord } from "@/features/archive/actions/archive.actions";
import { formatArchiveFolderOptionLabel } from "@/features/archive/lib/archive-folder-tree";
import {
  initialArchiveActionState,
  type ArchiveFolderOption,
} from "@/features/archive/types/archive";

type ArchiveWorkOrderModalProps = Readonly<{
  open: boolean;
  onClose: () => void;
  workOrderId: string;
  spaceId: string;
  workOrderTitle: string;
  defaultFolderId: string;
  folders: ArchiveFolderOption[];
}>;

export function ArchiveWorkOrderModal({
  open,
  onClose,
  workOrderId,
  spaceId,
  workOrderTitle,
  defaultFolderId,
  folders,
}: ArchiveWorkOrderModalProps) {
  const [state, formAction, isPending] = useActionState(
    archiveWorkOrderRecord,
    initialArchiveActionState,
  );
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const hasCustomFolders = useMemo(
    () => folders.some((folder) => !folder.isSystemDefault),
    [folders],
  );

  function handleClose() {
    setShowCreateFolder(false);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Archive Work Order"
      description="Choose where this completed record should live in Archive."
    >
      <form action={formAction} className="space-y-4 px-5 py-4">
        <input type="hidden" name="workOrderId" value={workOrderId} />
        <input type="hidden" name="spaceId" value={spaceId} />
        <input type="hidden" name="returnTo" value={`/archive?folder=${defaultFolderId}`} />

        <FormMessage message={state.error} />

        <div className="rounded-2xl border border-border bg-panel-muted px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
            Work Order
          </p>
          <p className="mt-3 text-base font-semibold text-foreground">{workOrderTitle}</p>
          <p className="mt-2 text-sm text-muted">
            This work order will become read-only and permanently stored in Archive.
          </p>
        </div>

        <label className="block space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-foreground">Archive Folder</span>
            <button
              type="button"
              onClick={() => setShowCreateFolder((current) => !current)}
              className="text-xs font-semibold text-foreground transition-colors hover:text-muted"
            >
              {showCreateFolder
                ? "Use existing folder"
                : hasCustomFolders
                  ? "Create folder"
                  : "Create first folder"}
            </button>
          </div>
          <select
            name="archiveFolderId"
            defaultValue={defaultFolderId}
            className="h-11 w-full rounded-xl border border-border bg-panel px-3 text-sm text-foreground outline-none"
          >
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {formatArchiveFolderOptionLabel(folder)}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted">
            If you do not choose a different folder, this record will be stored in Unsorted Archive.
          </p>
        </label>

        {showCreateFolder || !hasCustomFolders ? (
          <div className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">Create New Folder</span>
              <input
                name="newArchiveFolderName"
                type="text"
                placeholder="Folder name"
                className="h-11 w-full rounded-xl border border-border bg-panel px-3 text-sm text-foreground outline-none"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">Parent Folder</span>
              <select
                name="newArchiveParentFolderId"
                defaultValue=""
                className="h-11 w-full rounded-xl border border-border bg-panel px-3 text-sm text-foreground outline-none"
              >
                <option value="">Top level</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {formatArchiveFolderOptionLabel(folder)}
                  </option>
                ))}
              </select>
            </label>

            <p className="text-xs text-muted">
              Add a new folder here and this work order will be stored there automatically.
            </p>
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button
            type="button"
            variant="secondary"
            disabled={isPending}
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Archiving..." : "Archive Work Order"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
