"use client";

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { DeleteWorkOrderModal } from "@/features/work-orders/ui/delete-work-order-modal";
import type { WorkOrder } from "@/types/work-order";

type WorkOrderOverviewHeroMenuProps = Readonly<{
  workOrder: WorkOrder;
}>;

export function WorkOrderOverviewHeroMenu({ workOrder }: WorkOrderOverviewHeroMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
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
    <>
      <div className="relative shrink-0" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-panel-muted hover:text-foreground"
          aria-label="Work order actions"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
        {menuOpen ? (
          <div className="absolute right-0 top-11 z-20 min-w-44 rounded-lg border border-border bg-panel p-1 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
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
          </div>
        ) : null}
      </div>
      <DeleteWorkOrderModal
        open={deleteOpen}
        workOrder={workOrder}
        onClose={() => setDeleteOpen(false)}
      />
    </>
  );
}
