import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type SidebarItemTone = "light" | "dark";

type SidebarItemProps = Readonly<{
  label: string;
  href: string;
  icon: LucideIcon;
  isActive?: boolean;
  compact?: boolean;
  tone?: SidebarItemTone;
  className?: string;
}>;

const toneClasses: Record<
  SidebarItemTone,
  {
    base: string;
    active: string;
    iconBase: string;
    iconActive: string;
    arrowBase: string;
    arrowActive: string;
  }
> = {
  light: {
    base: "border-transparent text-muted hover:border-border hover:bg-panel-muted hover:text-foreground",
    active: "border-border-strong bg-accent-soft text-foreground shadow-[0_10px_22px_rgba(47,95,212,0.08)] dark:shadow-none",
    iconBase: "border-border bg-panel-muted text-muted group-hover:border-border-strong group-hover:text-accent",
    iconActive: "border-border bg-panel text-accent",
    arrowBase: "text-muted group-hover:translate-x-0.5",
    arrowActive: "text-accent",
  },
  dark: {
    base: "border-transparent text-muted hover:border-border hover:bg-panel hover:text-foreground",
    active: "border-transparent bg-accent text-white shadow-[0_12px_26px_rgba(31,95,255,0.24)] dark:shadow-none",
    iconBase: "border-border bg-panel-muted text-muted group-hover:border-border-strong group-hover:text-accent",
    iconActive: "border-white/10 bg-white/10 text-white",
    arrowBase: "text-muted/80 group-hover:translate-x-0.5",
    arrowActive: "text-white/90",
  },
};

export function SidebarItem({
  label,
  href,
  icon: Icon,
  isActive = false,
  compact = false,
  tone = "light",
  className,
}: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center transition-all",
        compact
          ? "h-11 w-11 justify-center rounded-xl border"
          : "min-w-0 gap-3 overflow-hidden rounded-[1.35rem] border px-3 py-3 text-sm font-medium",
        isActive ? toneClasses[tone].active : toneClasses[tone].base,
        className,
      )}
      aria-current={isActive ? "page" : undefined}
      title={compact ? label : undefined}
    >
      {compact ? (
        <>
          <Icon className="h-4 w-4 shrink-0" />
          <span className="sr-only">{label}</span>
        </>
      ) : (
        <>
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-colors",
              isActive ? toneClasses[tone].iconActive : toneClasses[tone].iconBase,
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
          </div>
          <span className="min-w-0 flex-1 truncate">{label}</span>
          <span
            aria-hidden="true"
            className={cn(
              "text-base transition-transform",
              isActive ? toneClasses[tone].arrowActive : toneClasses[tone].arrowBase,
            )}
          >
            {">"}
          </span>
        </>
      )}
    </Link>
  );
}
