import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ArchiveFolderTreeGuidesProps = Readonly<{
  guides?: boolean[];
  isBranchEnd?: boolean;
}>;

type ArchiveFolderNavItemProps = Readonly<{
  href: string;
  label: string;
  count: number;
  icon: LucideIcon;
  depth?: number;
  treeGuides?: boolean[];
  isBranchEnd?: boolean;
  toggleButton?: Readonly<{
    isExpanded: boolean;
    onToggle: () => void;
    ariaLabel: string;
  }> | null;
  isActive?: boolean;
  isSystem?: boolean;
}>;

export function ArchiveFolderTreeGuides({
  guides = [],
  isBranchEnd = false,
}: ArchiveFolderTreeGuidesProps) {
  if (guides.length === 0) {
    return null;
  }

  return (
    <div className="flex h-8 shrink-0 items-stretch">
      {guides.map((hasLine, index) => (
        <span key={`ancestor-${index}`} className="relative block w-4">
          {hasLine ? (
            <span className="absolute bottom-[-0.8rem] left-1/2 top-[-0.8rem] w-px -translate-x-1/2 bg-slate-200" />
          ) : null}
        </span>
      ))}
      <span className="relative block w-4">
        <span className="absolute left-1/2 top-[-0.8rem] bottom-1/2 w-px -translate-x-1/2 bg-slate-200" />
        <span className="absolute left-1/2 top-1/2 h-px w-3 bg-slate-200" />
        {!isBranchEnd ? (
          <span className="absolute bottom-[-0.8rem] left-1/2 top-1/2 w-px -translate-x-1/2 bg-slate-200" />
        ) : null}
      </span>
    </div>
  );
}

export function ArchiveFolderNavItem({
  href,
  label,
  count,
  icon: Icon,
  depth = 0,
  treeGuides,
  isBranchEnd = false,
  toggleButton = null,
  isActive = false,
  isSystem = false,
}: ArchiveFolderNavItemProps) {
  const content = (
    <>
      <div className="flex min-w-0 items-center gap-3">
        <ArchiveFolderTreeGuides guides={treeGuides} isBranchEnd={isBranchEnd} />
        {toggleButton ? (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              toggleButton.onToggle();
            }}
            aria-label={toggleButton.ariaLabel}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:text-slate-900"
          >
            <ChevronRight
              className={cn(
                "h-4 w-4 transition-transform",
                toggleButton.isExpanded ? "rotate-90" : "rotate-0",
              )}
            />
          </button>
        ) : (
          <span className="block w-7 shrink-0" aria-hidden="true" />
        )}
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
            isActive
              ? "border-accent/35 bg-accent-soft text-accent"
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
            ? "border-accent/30 bg-accent-soft text-accent"
            : "border-slate-200 bg-white text-slate-600",
        )}
      >
        {count}
      </span>
    </>
  );

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group flex items-center justify-between rounded-xl border px-3 py-2.5 transition-colors",
        isActive
          ? "border-accent/40 bg-accent-soft/80 text-foreground shadow-sm"
          : "border-transparent bg-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-950",
      )}
      style={
        !isSystem && depth > 0 && (!treeGuides || treeGuides.length === 0)
          ? { paddingLeft: `${0.75 + depth * 1.1}rem` }
          : undefined
      }
    >
      {content}
    </Link>
  );
}
