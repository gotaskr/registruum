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
        "rounded-lg border shadow-sm",
        highlighted
          ? "border-slate-300 bg-slate-50 shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
          : "border-border bg-panel",
      )}
    >
      <div className="space-y-2 px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
          {label}
        </p>
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-muted">{description}</p>
        </div>
      </div>
      <div className="border-t border-border px-5 py-4">{children}</div>
    </section>
  );
}
