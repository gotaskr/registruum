import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SpaceInfoCardProps = Readonly<{
  label: string;
  value: ReactNode;
  helper?: string;
  children?: ReactNode;
  orientation?: "vertical" | "horizontal";
}>;

export function SpaceInfoCard({
  label,
  value,
  helper,
  children,
  orientation = "vertical",
}: SpaceInfoCardProps) {
  return (
    <article className="rounded-2xl bg-panel px-5 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] ring-1 ring-border">
      <div
        className={cn(
          orientation === "horizontal"
            ? "flex min-h-[7rem] flex-col justify-between gap-4"
            : "space-y-3",
        )}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
          {label}
        </p>
        <div
          className={cn(
            "space-y-1",
            orientation === "horizontal" ? "flex items-end justify-between gap-4 space-y-0" : "",
          )}
        >
          <div className="text-2xl font-semibold tracking-tight text-foreground">{value}</div>
          {helper ? <p className="text-sm text-muted">{helper}</p> : null}
        </div>
        {children}
      </div>
    </article>
  );
}
