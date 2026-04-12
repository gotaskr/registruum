"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type MobileBottomSheetProps = Readonly<{
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}>;

export function MobileBottomSheet({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: MobileBottomSheetProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/45 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className={cn(
          "w-full rounded-t-[32px] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafe_100%)] px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-4 shadow-[0_-24px_60px_rgba(15,23,42,0.18)]",
          className,
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[1.08rem] font-semibold text-slate-950">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-[0_8px_18px_rgba(15,23,42,0.05)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
