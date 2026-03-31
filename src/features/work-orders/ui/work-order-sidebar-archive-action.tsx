"use client";

import { useState } from "react";
import { Archive } from "lucide-react";
import { ArchiveWorkOrderModal } from "@/features/archive/ui/archive-work-order-modal";
import type { ArchiveFolderOption } from "@/features/archive/types/archive";

type WorkOrderSidebarArchiveActionProps = Readonly<{
  workOrderId: string;
  spaceId: string;
  workOrderTitle: string;
  defaultArchiveFolderId: string;
  folders: ArchiveFolderOption[];
}>;

export function WorkOrderSidebarArchiveAction({
  workOrderId,
  spaceId,
  workOrderTitle,
  defaultArchiveFolderId,
  folders,
}: WorkOrderSidebarArchiveActionProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-panel px-2.5 text-[11px] font-semibold text-foreground transition-colors hover:bg-panel-muted"
        aria-label={`Archive ${workOrderTitle}`}
      >
        <Archive className="h-3.5 w-3.5" />
        <span>Archive</span>
      </button>
      <ArchiveWorkOrderModal
        open={open}
        onClose={() => setOpen(false)}
        workOrderId={workOrderId}
        spaceId={spaceId}
        workOrderTitle={workOrderTitle}
        defaultFolderId={defaultArchiveFolderId}
        folders={folders}
      />
    </>
  );
}
