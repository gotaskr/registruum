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
  /** Desktop space archive rail: icon-only until parent `group/archiveRail` hover or focus-within. */
  archiveRail?: boolean;
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
  archiveRail = false,
}: ArchiveFolderNavItemProps) {
  const depthPadding =
    !isSystem && depth > 0 && (!treeGuides || treeGuides.length === 0)
      ? `${0.75 + depth * 1.1}rem`
      : null;

  const railToggleClasses = archiveRail
    ? "lg:hidden lg:group-hover/archiveRail:inline-flex lg:group-focus-within/archiveRail:inline-flex lg:group-data-[archive-rail=expanded]/archiveRail:inline-flex"
    : undefined;
  const railSpacerClasses = archiveRail
    ? "lg:hidden lg:group-hover/archiveRail:block lg:group-focus-within/archiveRail:block lg:group-data-[archive-rail=expanded]/archiveRail:block"
    : undefined;
  const railGuidesClasses = archiveRail
    ? "lg:hidden lg:group-hover/archiveRail:contents lg:group-focus-within/archiveRail:contents lg:group-data-[archive-rail=expanded]/archiveRail:contents"
    : undefined;

  const content = (
    <>
      <div
        className={cn(
          "flex min-w-0 items-center gap-3",
          archiveRail &&
            "lg:w-full lg:justify-center lg:gap-0 lg:group-hover/archiveRail:w-auto lg:group-hover/archiveRail:justify-start lg:group-hover/archiveRail:gap-3 lg:group-focus-within/archiveRail:w-auto lg:group-focus-within/archiveRail:justify-start lg:group-focus-within/archiveRail:gap-3 lg:group-data-[archive-rail=expanded]/archiveRail:w-auto lg:group-data-[archive-rail=expanded]/archiveRail:justify-start lg:group-data-[archive-rail=expanded]/archiveRail:gap-3",
        )}
      >
        {treeGuides && treeGuides.length > 0 ? (
          <span className={cn(railGuidesClasses)}>
            <ArchiveFolderTreeGuides guides={treeGuides} isBranchEnd={isBranchEnd} />
          </span>
        ) : (
          <ArchiveFolderTreeGuides guides={treeGuides} isBranchEnd={isBranchEnd} />
        )}
        {toggleButton ? (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              toggleButton.onToggle();
            }}
            aria-label={toggleButton.ariaLabel}
            className={cn(
              "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:text-slate-900",
              railToggleClasses,
            )}
          >
            <ChevronRight
              className={cn(
                "h-4 w-4 transition-transform",
                toggleButton.isExpanded ? "rotate-90" : "rotate-0",
              )}
            />
          </button>
        ) : (
          <span className={cn("block w-7 shrink-0", railSpacerClasses)} aria-hidden="true" />
        )}
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
            isActive
              ? "border-accent/35 bg-accent-soft text-accent"
              : isSystem
                ? "border-slate-200 bg-slate-50 text-slate-700"
                : "border-slate-200 bg-white text-slate-600 group-hover:text-slate-900",
            archiveRail &&
              "lg:mx-auto lg:group-hover/archiveRail:mx-0 lg:group-focus-within/archiveRail:mx-0 lg:group-data-[archive-rail=expanded]/archiveRail:mx-0",
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <p
          className={cn(
            "truncate text-sm font-medium",
            archiveRail &&
              "lg:hidden lg:max-w-0 lg:overflow-hidden lg:opacity-0 lg:transition-opacity lg:duration-200 lg:group-hover/archiveRail:block lg:group-hover/archiveRail:max-w-none lg:group-hover/archiveRail:opacity-100 lg:group-focus-within/archiveRail:block lg:group-focus-within/archiveRail:max-w-none lg:group-focus-within/archiveRail:opacity-100 lg:group-data-[archive-rail=expanded]/archiveRail:block lg:group-data-[archive-rail=expanded]/archiveRail:max-w-none lg:group-data-[archive-rail=expanded]/archiveRail:opacity-100",
          )}
        >
          {label}
        </p>
      </div>

      <span
        className={cn(
          "ml-3 inline-flex min-w-8 items-center justify-center rounded-full border px-2.5 py-1 text-xs font-semibold",
          isActive
            ? "border-accent/30 bg-accent-soft text-accent"
            : "border-slate-200 bg-white text-slate-600",
          archiveRail &&
            "lg:ml-0 lg:hidden lg:group-hover/archiveRail:ml-3 lg:group-hover/archiveRail:inline-flex lg:group-focus-within/archiveRail:ml-3 lg:group-focus-within/archiveRail:inline-flex lg:group-data-[archive-rail=expanded]/archiveRail:ml-3 lg:group-data-[archive-rail=expanded]/archiveRail:inline-flex",
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
        archiveRail &&
          "lg:min-h-[2.75rem] lg:justify-center lg:px-1.5 lg:py-2 lg:group-hover/archiveRail:justify-between lg:group-hover/archiveRail:px-3 lg:group-hover/archiveRail:py-2.5 lg:group-focus-within/archiveRail:justify-between lg:group-focus-within/archiveRail:px-3 lg:group-focus-within/archiveRail:py-2.5 lg:group-data-[archive-rail=expanded]/archiveRail:justify-between lg:group-data-[archive-rail=expanded]/archiveRail:px-3 lg:group-data-[archive-rail=expanded]/archiveRail:py-2.5",
        archiveRail &&
          depthPadding &&
          `lg:pl-1.5 lg:pr-1.5 lg:group-hover/archiveRail:[padding-left:${depthPadding}] lg:group-hover/archiveRail:pr-3 lg:group-focus-within/archiveRail:[padding-left:${depthPadding}] lg:group-focus-within/archiveRail:pr-3 lg:group-data-[archive-rail=expanded]/archiveRail:[padding-left:${depthPadding}] lg:group-data-[archive-rail=expanded]/archiveRail:pr-3`,
        archiveRail &&
          !depthPadding &&
          "lg:px-1.5 lg:group-hover/archiveRail:px-3 lg:group-focus-within/archiveRail:px-3 lg:group-data-[archive-rail=expanded]/archiveRail:px-3",
      )}
      style={
        archiveRail || !depthPadding
          ? undefined
          : { paddingLeft: depthPadding }
      }
    >
      {content}
    </Link>
  );
}
