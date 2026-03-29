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

const toneClasses: Record<SidebarItemTone, { base: string; active: string }> = {
  light: {
    base: "text-[#6f7d92] hover:bg-[#f3f7fd] hover:text-[#1f2a3d]",
    active: "bg-[#eaf1ff] text-[#356dff]",
  },
  dark: {
    base: "text-[#98a3b7] hover:bg-[#252b37] hover:text-white",
    active: "bg-[#1d4fa3] text-white",
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
        "inline-flex items-center transition-colors",
        compact ? "h-11 w-11 justify-center rounded-xl" : "gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
        isActive ? toneClasses[tone].active : toneClasses[tone].base,
        className,
      )}
      aria-current={isActive ? "page" : undefined}
      title={compact ? label : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {compact ? <span className="sr-only">{label}</span> : <span>{label}</span>}
    </Link>
  );
}
