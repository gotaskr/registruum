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
        "overflow-hidden rounded-[2rem] border shadow-[0_18px_36px_rgba(15,23,42,0.05)]",
        highlighted
          ? "border-border-strong bg-panel-muted"
          : "border-border bg-panel",
      )}
    >
      <div className="space-y-2 px-6 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
          {label}
        </p>
        <div>
          <h2 className="text-[1.45rem] font-semibold tracking-tight text-foreground">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
        </div>
      </div>
      <div className="border-t border-border px-6 py-5">{children}</div>
    </section>
  );
}
