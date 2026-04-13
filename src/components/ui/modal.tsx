"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ModalProps = Readonly<{
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  panelClassName?: string;
  /** Below `lg`, present as a bottom sheet (full width, rounded top). */
  bottomSheetOnNarrow?: boolean;
  /** Applied to the scrollable body below the header. */
  contentClassName?: string;
  children: ReactNode;
}>;

export function Modal({
  open,
  title,
  description,
  onClose,
  panelClassName,
  bottomSheetOnNarrow = false,
  contentClassName,
  children,
}: ModalProps) {
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

  if (!open) {
    return null;
  }

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-50 flex justify-center bg-slate-950/25",
        bottomSheetOnNarrow
          ? "items-end px-0 pb-0 pt-[max(0.5rem,env(safe-area-inset-top,0px))] lg:items-center lg:px-4 lg:py-4 lg:pt-4"
          : "items-center px-4 py-4",
      )}
    >
      <div
        className="absolute inset-0"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          "relative z-10 flex w-full flex-col overflow-hidden border border-border bg-panel shadow-[0_10px_40px_rgba(15,23,42,0.12)]",
          bottomSheetOnNarrow
            ? "max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-bottom,0px)-0.5rem))] max-w-none rounded-t-[1.75rem] rounded-b-none border-x-0 border-b-0 lg:max-h-[calc(100vh-2rem)] lg:max-w-md lg:rounded-2xl lg:border-x lg:border-b"
            : "max-h-[calc(100vh-2rem)] max-w-md rounded-2xl",
          panelClassName,
        )}
      >
        {bottomSheetOnNarrow ? (
          <div
            className="flex justify-center pt-3 pb-1 lg:hidden"
            aria-hidden
          >
            <span className="h-1 w-11 rounded-full bg-slate-300/90 dark:bg-slate-500/60" />
          </div>
        ) : null}
        <div
          className={cn(
            "flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3 sm:gap-4 sm:px-5 sm:py-4",
            bottomSheetOnNarrow && "lg:pt-4",
            bottomSheetOnNarrow && "max-lg:px-4 max-lg:pb-3 max-lg:pt-2",
          )}
        >
          <div className="min-w-0 flex-1 pr-1">
            <h2
              id="modal-title"
              className={cn(
                "font-semibold tracking-tight text-foreground",
                bottomSheetOnNarrow ? "text-lg" : "text-base sm:text-lg",
              )}
            >
              {title}
            </h2>
            {description ? (
              <p
                className={cn(
                  "mt-1.5 leading-snug",
                  bottomSheetOnNarrow
                    ? "text-xs text-slate-600 max-lg:line-clamp-3 dark:text-slate-300 sm:text-sm sm:text-slate-700 sm:dark:text-slate-200"
                    : "text-sm text-slate-600 dark:text-slate-300",
                )}
              >
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 touch-manipulation items-center justify-center rounded-xl text-muted transition-colors hover:bg-panel-muted hover:text-foreground sm:h-8 sm:w-8 sm:rounded-lg"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div
          className={cn(
            "min-h-0 overscroll-contain",
            bottomSheetOnNarrow
              ? "flex min-h-0 flex-1 flex-col overflow-hidden pb-0 lg:block lg:flex-none lg:overflow-y-auto"
              : "overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom,0px))] lg:pb-0",
            contentClassName,
          )}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
