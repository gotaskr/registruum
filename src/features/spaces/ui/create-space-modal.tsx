"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { Factory, MapPin, X } from "lucide-react";
import { FormMessage } from "@/features/auth/ui/form-message";
import { createSpace } from "@/features/spaces/actions/space.actions";
import { spaceTypeOptions } from "@/features/spaces/lib/space-types";
import { initialSpaceActionState } from "@/features/spaces/types/space-action-state";
import { SpacePhotoField } from "@/features/spaces/ui/space-photo-field";
import { cn } from "@/lib/utils";

type CreateSpaceModalProps = Readonly<{
  open: boolean;
  onClose: () => void;
}>;

function isLargeViewport() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 1024px)").matches
  );
}

export function CreateSpaceModal({
  open,
  onClose,
}: CreateSpaceModalProps) {
  const [state, formAction, isPending] = useActionState(
    createSpace,
    initialSpaceActionState,
  );
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef(0);
  const pointerStartY = useRef(0);
  const dragStartOffset = useRef(0);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDraggingSheet, setIsDraggingSheet] = useState(false);
  const isDraggingSheetRef = useRef(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    dragOffsetRef.current = 0;
    setDragOffsetY(0);
    setIsDraggingSheet(false);
    isDraggingSheetRef.current = false;
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function handleSheetPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (isLargeViewport() || isPending) {
      return;
    }
    if (event.button !== 0) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerStartY.current = event.clientY;
    dragStartOffset.current = dragOffsetRef.current;
    isDraggingSheetRef.current = true;
    setIsDraggingSheet(true);
  }

  function handleSheetPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isDraggingSheetRef.current) {
      return;
    }
    const delta = event.clientY - pointerStartY.current;
    const next = Math.max(0, dragStartOffset.current + delta);
    dragOffsetRef.current = next;
    setDragOffsetY(next);
  }

  function endSheetDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isDraggingSheetRef.current) {
      return;
    }
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* released */
    }
    isDraggingSheetRef.current = false;
    setIsDraggingSheet(false);
    const height = sheetRef.current?.offsetHeight ?? 320;
    const threshold = Math.min(200, Math.max(96, height * 0.2));
    if (dragOffsetRef.current > threshold) {
      dragOffsetRef.current = 0;
      setDragOffsetY(0);
      onClose();
      return;
    }
    dragOffsetRef.current = 0;
    setDragOffsetY(0);
  }

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-50 flex bg-slate-950/45 backdrop-blur-[2px]",
        "items-end justify-center p-0",
        "lg:items-center lg:justify-center lg:bg-slate-950/25 lg:p-4 lg:backdrop-blur-none",
      )}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-space-title"
        className={cn(
          "relative z-10 flex w-full max-w-full flex-col overflow-hidden border-[#dbe4f0] bg-[#f8fbff] shadow-[0_-12px_48px_rgba(15,23,42,0.18)] will-change-transform dark:border-border dark:bg-panel dark:shadow-[0_-12px_48px_rgba(0,0,0,0.45)]",
          "max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-bottom)-0.5rem))] rounded-t-[1.75rem] border-x border-t",
          "lg:max-h-[calc(100vh-2rem)] lg:max-w-xl lg:translate-y-0 lg:rounded-[2rem] lg:border lg:shadow-[0_24px_60px_rgba(15,23,42,0.14)]",
          !isDraggingSheet && "lg:transition-none motion-reduce:transition-none",
          !isDraggingSheet &&
            "transition-[transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
        )}
        style={
          isLargeViewport()
            ? undefined
            : { transform: `translateY(${dragOffsetY}px)` }
        }
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="shrink-0 touch-none select-none lg:touch-auto lg:select-text"
          onPointerDown={handleSheetPointerDown}
          onPointerMove={handleSheetPointerMove}
          onPointerUp={endSheetDrag}
          onPointerCancel={endSheetDrag}
        >
          <div
            className="flex cursor-grab justify-center pt-3 pb-2 active:cursor-grabbing lg:hidden"
            aria-hidden
          >
            <div className="h-1 w-11 rounded-full bg-slate-300/90 dark:bg-slate-600" />
          </div>

          <div className="flex items-start justify-between gap-3 border-b border-[#dbe4f0] px-5 pb-4 pt-0 dark:border-border lg:pt-0">
            <div className="min-w-0 flex-1">
              <h2
                id="create-space-title"
                className="text-lg font-semibold tracking-tight text-foreground lg:text-base"
              >
                Create Space
              </h2>
              <p className="mt-1 text-sm text-muted">
                Set up a new space for your workorders, team, and archive.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              onPointerDown={(event) => event.stopPropagation()}
              className="inline-flex h-10 w-10 shrink-0 cursor-pointer touch-auto items-center justify-center rounded-xl text-muted transition-colors hover:bg-panel-muted hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <form action={formAction} className="space-y-5 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:px-5 sm:pb-5 sm:pt-5">
            <FormMessage message={state.error} />

            <section className="rounded-[1.5rem] border border-[#dbe4f0] bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.05)] dark:border-border dark:bg-panel sm:rounded-[1.75rem] sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <SpacePhotoField defaultLabel="New Space" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8093af] dark:text-muted">
                    Space Setup
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-foreground sm:text-xl">
                    Create a new workspace hub
                  </h3>
                </div>
              </div>
              {state.fieldErrors?.photo ? (
                <p className="mt-3 text-sm text-rose-700">{state.fieldErrors.photo}</p>
              ) : null}

              <div className="mt-5 grid gap-4 sm:mt-6">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-foreground">
                    Name of Space
                  </span>
                  <input
                    name="name"
                    type="text"
                    autoFocus
                    placeholder="South Tower Operations"
                    className="h-12 w-full rounded-2xl border border-[#dbe4f0] bg-[#f9fbff] px-4 text-sm text-foreground outline-none transition focus:border-[#97b5ff] focus:bg-white dark:border-border dark:bg-panel-muted dark:focus:border-accent"
                  />
                  {state.fieldErrors?.name ? (
                    <p className="text-sm text-rose-700">{state.fieldErrors.name}</p>
                  ) : null}
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-foreground">
                    Type of Space
                  </span>
                  <div className="relative">
                    <select
                      name="spaceType"
                      defaultValue=""
                      className="h-12 w-full appearance-none rounded-2xl border border-[#dbe4f0] bg-[#f9fbff] px-4 pr-10 text-sm text-foreground outline-none transition focus:border-[#97b5ff] focus:bg-white dark:border-border dark:bg-panel-muted dark:focus:border-accent"
                    >
                      <option value="" disabled>
                        Select a space type
                      </option>
                      {spaceTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <Factory className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7f8ca3] dark:text-muted" />
                  </div>
                  {state.fieldErrors?.spaceType ? (
                    <p className="text-sm text-rose-700">
                      {state.fieldErrors.spaceType}
                    </p>
                  ) : null}
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-foreground">Address</span>
                  <div className="relative">
                    <input
                      name="address"
                      type="text"
                      placeholder="123 Main St, Edmonton"
                      className="h-12 w-full rounded-2xl border border-[#dbe4f0] bg-[#f9fbff] px-4 pr-10 text-sm text-foreground outline-none transition focus:border-[#97b5ff] focus:bg-white dark:border-border dark:bg-panel-muted dark:focus:border-accent"
                    />
                    <MapPin className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7f8ca3] dark:text-muted" />
                  </div>
                  {state.fieldErrors?.address ? (
                    <p className="text-sm text-rose-700">{state.fieldErrors.address}</p>
                  ) : null}
                </label>
              </div>
            </section>

            <div className="flex flex-col-reverse gap-2 border-t border-[#dbe4f0] pt-4 dark:border-border sm:flex-row sm:justify-end sm:gap-3 sm:pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-[#dbe4f0] bg-white px-5 text-sm font-medium text-foreground shadow-[0_10px_24px_rgba(15,23,42,0.04)] disabled:opacity-60 dark:border-border dark:bg-panel sm:h-11 sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#1f5fff] px-5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(31,95,255,0.24)] disabled:opacity-60 dark:shadow-none sm:h-11 sm:w-auto"
              >
                {isPending ? "Creating..." : "Create Space"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  );
}
