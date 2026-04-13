import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SettingsCardProps = Readonly<{
  id?: string;
  label: string;
  title: string;
  description: string;
  highlighted?: boolean;
  children: ReactNode;
}>;

export function SettingsCard({
  id,
  label,
  title,
  description,
  highlighted = false,
  children,
}: SettingsCardProps) {
  return (
    <section
      id={id}
      className={cn(
        "overflow-hidden rounded-xl border shadow-sm sm:rounded-[2rem] sm:shadow-[0_18px_36px_rgba(15,23,42,0.05)]",
        highlighted
          ? "border-border-strong bg-panel-muted"
          : "border-border bg-panel",
      )}
    >
      <div className="space-y-1.5 px-4 py-4 sm:space-y-2 sm:px-6 sm:py-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted sm:text-[11px] sm:tracking-[0.24em]">
          {label}
        </p>
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-[1.45rem]">
            {title}
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-muted sm:mt-2 sm:text-sm sm:leading-6">
            {description}
          </p>
        </div>
      </div>
      <div className="border-t border-border px-4 py-4 sm:px-6 sm:py-5">{children}</div>
    </section>
  );
}
