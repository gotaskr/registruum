"use client";

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, PencilLine, Trash2 } from "lucide-react";
import { EditWorkOrderModal } from "@/features/work-orders/ui/edit-work-order-modal";
import { DeleteWorkOrderModal } from "@/features/work-orders/ui/delete-work-order-modal";
import type { WorkOrderPermissionSet } from "@/features/permissions/lib/work-order-permissions";
import type { SpaceMembershipRole } from "@/types/database";
import type { WorkOrder } from "@/types/work-order";

type WorkOrderSidebarActionsProps = Readonly<{
  workOrder: WorkOrder;
  actorRole: SpaceMembershipRole;
  permissions: WorkOrderPermissionSet;
  returnTo: string;
}>;

export function WorkOrderSidebarActions({
  workOrder,
  actorRole,
  permissions,
  returnTo,
}: WorkOrderSidebarActionsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const canEdit = permissions.canEditSettings;
  const canDelete = permissions.canDeleteWorkOrder;

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

  if (!canEdit && !canDelete) {
    return null;
  }

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-panel hover:text-foreground"
          aria-label="Open work order actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {menuOpen ? (
          <div className="absolute right-0 top-10 z-20 min-w-40 rounded-lg border border-border bg-panel p-1 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            {canEdit ? (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setEditOpen(true);
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-panel-muted"
              >
                <PencilLine className="h-4 w-4" />
                Edit
              </button>
            ) : null}
            {canDelete ? (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setDeleteOpen(true);
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-700 transition-colors hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      <EditWorkOrderModal
        open={editOpen}
        workOrder={workOrder}
        actorRole={actorRole}
        canEdit={canEdit}
        returnTo={returnTo}
        onClose={() => setEditOpen(false)}
      />
      <DeleteWorkOrderModal
        open={deleteOpen}
        workOrder={workOrder}
        onClose={() => setDeleteOpen(false)}
      />
    </>
  );
}
