"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { MoreHorizontal, Trash2, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { deleteSpace } from "@/features/spaces/actions/space.actions";
import {
  initialSpaceActionState,
} from "@/features/spaces/types/space-action-state";
import { cn } from "@/lib/utils";

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
      const target = event.target as Node;
      if (menuRef.current?.contains(target)) {
        return;
      }
      // Mobile sheet lives outside menuRef; ignore clicks on it (handled by sheet UI).
      if ((target as HTMLElement).closest?.("[data-space-actions-sheet]")) {
        return;
      }
      setIsMenuOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <>
      <div className="relative shrink-0" ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsMenuOpen((current) => !current)}
          className={cn(
            "inline-flex touch-manipulation items-center justify-center rounded-xl border border-border bg-panel text-muted transition-colors hover:bg-panel-muted hover:text-foreground",
            "h-11 w-11 min-h-[44px] min-w-[44px] sm:h-10 sm:w-10 sm:min-h-0 sm:min-w-0",
          )}
          aria-expanded={isMenuOpen}
          aria-haspopup="dialog"
          aria-label="Open space actions"
        >
          <MoreHorizontal className="h-5 w-5 sm:h-4 sm:w-4" />
        </button>

        {isMenuOpen ? (
          <div
            className="absolute right-0 top-[calc(100%+0.5rem)] z-20 hidden w-44 rounded-xl border border-border bg-panel p-1.5 shadow-lg lg:block"
            role="menu"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsModalOpen(true);
                setIsMenuOpen(false);
              }}
              className="flex w-full min-h-10 items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50"
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              <span>Delete space</span>
            </button>
          </div>
        ) : null}
      </div>

      {isMenuOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="presentation">
          <button
            type="button"
            tabIndex={-1}
            aria-label="Close menu"
            className="absolute inset-0 bg-black/30"
            onClick={() => setIsMenuOpen(false)}
          />
          <div
            data-space-actions-sheet
            className="absolute inset-x-0 bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] z-50 rounded-t-2xl border border-border bg-panel px-4 pb-4 pt-3 shadow-[0_-12px_40px_rgba(15,23,42,0.12)]"
            role="dialog"
            aria-label="Space actions"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" aria-hidden />
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Space actions
              </p>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="inline-flex h-10 w-10 touch-manipulation items-center justify-center rounded-lg border border-border bg-panel-muted text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(true);
                setIsMenuOpen(false);
              }}
              className="flex w-full min-h-12 items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-left text-base font-medium text-rose-800 transition-colors active:bg-rose-100"
            >
              <Trash2 className="h-5 w-5 shrink-0" />
              <span>Delete this space…</span>
            </button>
            <p className="mt-2 px-1 text-xs leading-relaxed text-muted">
              You will confirm on the next step. This cannot be undone.
            </p>
          </div>
        </div>
      ) : null}

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
