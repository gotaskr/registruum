"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { CreateWorkOrderForm } from "@/features/work-orders/ui/create-work-order-form";
import { cn } from "@/lib/utils";

type CreateWorkOrderModalProps = Readonly<{
  open: boolean;
  spaceId: string;
  onClose: () => void;
}>;

function isLargeViewport() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 1024px)").matches
  );
}

export function CreateWorkOrderModal({
  open,
  spaceId,
  onClose,
}: CreateWorkOrderModalProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef(0);
  const pointerStartY = useRef(0);
  const dragStartOffset = useRef(0);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDraggingSheet, setIsDraggingSheet] = useState(false);
  const isDraggingSheetRef = useRef(false);
  const [formBusy, setFormBusy] = useState(false);

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
    if (isLargeViewport() || formBusy) {
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
        aria-labelledby="create-work-order-title"
        className={cn(
          "relative z-10 flex w-full max-w-full flex-col overflow-hidden border-[#dbe4f0] bg-[#f8fbff] shadow-[0_-12px_48px_rgba(15,23,42,0.18)] will-change-transform dark:border-border dark:bg-panel dark:shadow-[0_-12px_48px_rgba(0,0,0,0.45)]",
          "max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-bottom)-0.5rem))] rounded-t-[1.75rem] border-x border-t",
          "lg:max-h-[calc(100vh-2rem)] lg:max-w-3xl lg:translate-y-0 lg:rounded-[2rem] lg:border lg:shadow-[0_24px_60px_rgba(15,23,42,0.14)]",
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
                id="create-work-order-title"
                className="text-lg font-semibold tracking-tight text-foreground lg:text-base"
              >
                Create Work Order
              </h2>
              <p className="mt-1 text-sm text-muted">
                Add a new work order for this space.
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
          <CreateWorkOrderForm
            spaceId={spaceId}
            onCancel={onClose}
            onBusyChange={setFormBusy}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
