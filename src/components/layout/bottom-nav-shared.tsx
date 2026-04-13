import { cn } from "@/lib/utils";

export const BOTTOM_NAV_ICON_BOX =
  "flex h-6 w-6 shrink-0 items-center justify-center";

export function bottomNavItemClasses(
  isActive: boolean,
  opts?: Readonly<{ equalWidth?: boolean }>,
) {
  return cn(
    "touch-manipulation select-none outline-none",
    "flex flex-col items-center justify-center gap-1 rounded-[0.85rem] px-1 py-1.5",
    "transition-[color,background-color,box-shadow,transform] duration-150 ease-out motion-reduce:transition-none motion-reduce:active:scale-100",
    "active:scale-[0.97]",
    "focus-visible:ring-2 focus-visible:ring-[#2f5fd4]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-[#93c5fd]/50 dark:focus-visible:ring-offset-[#1e293b]",
    opts?.equalWidth ? "min-w-0 flex-1" : "w-[4.25rem] shrink-0",
    isActive
      ? "bg-slate-200/95 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] hover:bg-slate-300/90 active:bg-slate-300 dark:bg-[#2d405e] dark:text-white dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] dark:hover:bg-[#354a6d] dark:active:bg-[#283652]"
      : "text-slate-700 hover:bg-slate-100/95 active:bg-slate-200/90 dark:text-white/92 dark:hover:bg-white/[0.08] dark:active:bg-white/[0.14]",
  );
}

export function BottomNavLabel({
  children,
}: Readonly<{ children: string }>) {
  return (
    <span className="max-w-full truncate text-center text-[0.625rem] font-semibold leading-none tracking-tight text-inherit">
      {children}
    </span>
  );
}
