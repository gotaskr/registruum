"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { deleteSpace } from "@/features/spaces/actions/space.actions";
import {
  initialSpaceActionState,
} from "@/features/spaces/types/space-action-state";

type SpaceDeleteMenuProps = Readonly<{
  spaceId: string;
  spaceName: string;
  unfinishedWorkOrderCount: number;
}>;

export function SpaceDeleteMenu({
  spaceId,
  spaceName,
  unfinishedWorkOrderCount,
}: SpaceDeleteMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [state, deleteAction, isPending] = useActionState(
    deleteSpace,
    initialSpaceActionState,
  );
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [isMenuOpen]);

  return (
    <>
      <div className="relative shrink-0" ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsMenuOpen((current) => !current)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-panel text-muted transition-colors hover:bg-panel-muted hover:text-foreground"
          aria-label="Open space actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>

        {isMenuOpen ? (
          <div className="absolute right-0 top-[calc(100%+0.5rem)] z-20 w-44 rounded-2xl border border-border bg-panel p-1.5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(true);
                setIsMenuOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50"
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              <span>Delete Space</span>
            </button>
          </div>
        ) : null}
      </div>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Delete Space"
        description="This action permanently removes the space."
      >
        <form action={deleteAction} className="space-y-4 px-5 py-4">
          <input type="hidden" name="spaceId" value={spaceId} />

          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4">
            <p className="text-sm font-semibold text-rose-700">{spaceName}</p>
            <p className="mt-2 text-sm leading-6 text-rose-600">
              All unfinished work orders will be gone if you delete this space.
            </p>
            <p className="mt-2 text-sm leading-6 text-rose-600">
              Current unfinished count: {unfinishedWorkOrderCount}
            </p>
            <p className="mt-2 text-sm leading-6 text-rose-600">
              This permanently removes the space and its related work-order records.
            </p>
          </div>

          {state.error ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {state.error}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-panel px-4 text-sm font-medium text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Deleting..." : "Delete Space"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
