import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ArchiveFolderNavItemProps = Readonly<{
  href: string;
  label: string;
  count: number;
  icon: LucideIcon;
  isActive?: boolean;
  isSystem?: boolean;
}>;

export function ArchiveFolderNavItem({
  href,
  label,
  count,
  icon: Icon,
  isActive = false,
  isSystem = false,
}: ArchiveFolderNavItemProps) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group flex items-center justify-between rounded-xl border px-3 py-2.5 transition-colors",
        isActive
          ? "border-slate-300 bg-white text-slate-950 shadow-[0_4px_12px_rgba(15,23,42,0.04)]"
          : "border-transparent bg-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-950",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
            isActive
              ? "border-slate-200 bg-slate-50 text-slate-900"
              : isSystem
                ? "border-slate-200 bg-slate-50 text-slate-700"
                : "border-slate-200 bg-white text-slate-600 group-hover:text-slate-900",
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <p className="truncate text-sm font-medium">{label}</p>
      </div>

      <span
        className={cn(
          "ml-3 inline-flex min-w-8 items-center justify-center rounded-full border px-2.5 py-1 text-xs font-semibold",
          isActive
            ? "border-slate-200 bg-slate-100 text-slate-800"
            : "border-slate-200 bg-white text-slate-600",
        )}
      >
        {count}
      </span>
    </Link>
  );
}
