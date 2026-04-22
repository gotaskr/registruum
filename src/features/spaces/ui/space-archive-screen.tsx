"use client";

import Image from "next/image";
import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Archive,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  FolderTree,
  MapPin,
  Search,
  Vault,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MainShell } from "@/components/layout/main-shell";
import { RealtimeRouteRefresh } from "@/components/realtime/realtime-route-refresh";
import { ArchiveCreateFolderModal } from "@/features/archive/ui/archive-create-folder-modal";
import { ArchiveCustomFolderList } from "@/features/archive/ui/archive-custom-folder-list";
import { ArchiveFolderNavItem } from "@/features/archive/ui/archive-folder-nav-item";
import type {
  ArchiveFolder,
  ArchiveSortOption,
  ArchivedWorkOrderItem,
} from "@/features/archive/types/archive";
import { getSpaceTypeLabel } from "@/features/spaces/lib/space-types";
import {
  archiveControlClass,
  archiveSearchInputClass,
} from "@/features/archive/lib/archive-form-styles";
import { getArchiveRecordHref } from "@/lib/route-utils";
import { cn } from "@/lib/utils";
import type { Space } from "@/types/space";

type SpaceArchiveScreenProps = Readonly<{
  space: Space;
  folders: ArchiveFolder[];
  selectedFolderId: string | null;
  defaultFolderId: string;
  items: ArchivedWorkOrderItem[];
  searchQuery: string;
  sort: ArchiveSortOption;
  totalCount: number;
}>;

const sortOptions: ReadonlyArray<{
  value: ArchiveSortOption;
  label: string;
}> = [
  { value: "archived_desc", label: "Newest archived" },
  { value: "archived_asc", label: "Oldest archived" },
];

export function SpaceArchiveScreen({
  space,
  folders,
  selectedFolderId,
  defaultFolderId,
  items,
  searchQuery,
  sort,
  totalCount,
}: SpaceArchiveScreenProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchQuery);
  /** Default open so mobile users reach folders and records without an extra tap. */
  const [isArchiveOpen, setIsArchiveOpen] = useState(true);

  const customFolders = useMemo(
    () => folders.filter((folder) => !folder.isSystemDefault),
    [folders],
  );
  const defaultFolder = useMemo(
    () => folders.find((folder) => folder.id === defaultFolderId) ?? null,
    [defaultFolderId, folders],
  );
  const selectedFolder = useMemo(
    () => folders.find((folder) => folder.id === selectedFolderId) ?? null,
    [folders, selectedFolderId],
  );
  const allArchiveCount = useMemo(
    () =>
      folders
        .filter((folder) => folder.depth === 0)
        .reduce((total, folder) => total + folder.archivedCount, 0),
    [folders],
  );
  const spaceTypeLabel = getSpaceTypeLabel(space.spaceType);

  /** Root → leaf for breadcrumbs and parent jumps (excludes virtual “all” view). */
  const selectedFolderTrail = useMemo(() => {
    if (!selectedFolderId) {
      return [];
    }

    const byId = new Map(folders.map((folder) => [folder.id, folder]));
    const trail: ArchiveFolder[] = [];
    let current = byId.get(selectedFolderId);

    while (current) {
      trail.unshift(current);
      const parentId = current.parentId;
      current = parentId ? byId.get(parentId) : undefined;
    }

    return trail;
  }, [folders, selectedFolderId]);

  /** Custom folders in tree order for the mobile folder picker. */
  const mobileCustomFolderOrder = useMemo(() => {
    if (customFolders.length === 0) {
      return [];
    }

    const folderById = new Map(customFolders.map((folder) => [folder.id, folder]));
    const childrenByParent = new Map<string | null, typeof customFolders>();

    for (const folder of customFolders) {
      const parentId =
        folder.parentId && folderById.has(folder.parentId) ? folder.parentId : null;
      const siblings = childrenByParent.get(parentId) ?? [];

      siblings.push(folder);
      childrenByParent.set(parentId, siblings);
    }

    for (const [, siblings] of childrenByParent) {
      siblings.sort((left, right) => left.name.localeCompare(right.name));
    }

    const ordered: typeof customFolders = [];

    function visit(parentId: string | null) {
      const children = childrenByParent.get(parentId) ?? [];

      for (const child of children) {
        ordered.push(child);
        visit(child.id);
      }
    }

    visit(null);
    return ordered;
  }, [customFolders]);

  useEffect(() => {
    setQuery(searchQuery);
  }, [searchQuery]);

  /** Debounce search text into the URL. Do not rewrite `folder` or `sort` from props here — after
   * `router.push`, `useSearchParams()` updates immediately but `selectedFolderId` / `sort` from the
   * server can lag one frame, which was clearing `folder` and resetting the folder dropdown. */
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const nextParams = new URLSearchParams(searchParams.toString());

      if (query.trim()) {
        nextParams.set("query", query.trim());
      } else {
        nextParams.delete("query");
      }

      const nextQuery = nextParams.toString();
      if (nextQuery !== searchParams.toString()) {
        router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
      }
    }, 220);

    return () => window.clearTimeout(timeout);
  }, [pathname, query, router, searchParams]);

  function updateSort(nextSort: ArchiveSortOption) {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (query.trim()) {
      nextParams.set("query", query.trim());
    } else {
      nextParams.delete("query");
    }

    nextParams.set("sort", nextSort);
    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }

  function buildFolderHref(folderId: string | null) {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (folderId) {
      nextParams.set("folder", folderId);
    } else {
      nextParams.delete("folder");
    }

    if (query.trim()) {
      nextParams.set("query", query.trim());
    } else {
      nextParams.delete("query");
    }

    if (!nextParams.get("sort")) {
      nextParams.set("sort", sort);
    }

    const nextQuery = nextParams.toString();
    return nextQuery ? `${pathname}?${nextQuery}` : pathname;
  }

  function jumpDestinationClass(isActive: boolean) {
    return cn(
      "inline-flex shrink-0 items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors touch-manipulation",
      isActive
        ? "border-accent bg-accent-soft text-accent"
        : "border-border bg-panel text-foreground hover:bg-panel-muted",
    );
  }

  return (
    <MainShell
      title="Archive"
      description="Browse folders and archived work orders for this space."
      meta={
        <>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-panel-muted px-2.5 py-1 text-xs font-semibold text-foreground sm:hidden">
            <Archive className="h-3.5 w-3.5 text-accent" aria-hidden />
            <span className="tabular-nums">{items.length}</span>
            <span className="text-muted">/</span>
            <span className="tabular-nums">{totalCount}</span>
          </span>
          <span className="hidden items-center gap-2 rounded-full border border-border bg-panel-muted px-3 py-1.5 text-sm font-medium text-accent sm:inline-flex">
            <Archive className="h-4 w-4" aria-hidden />
            {items.length} visible / {totalCount} archived in {space.name}
          </span>
        </>
      }
    >
      <RealtimeRouteRefresh
        channelName={`space:archive:${space.id}`}
        subscriptions={[
          { table: "archive_folders", filter: `space_id=eq.${space.id}` },
          { table: "archived_work_orders", filter: `space_id=eq.${space.id}` },
        ]}
      />
      <section className="px-3 pb-10 pt-2 sm:px-5 sm:pb-6 sm:pt-4 lg:px-8 lg:py-6">
        {/* Desktop: search only while archive panel is open. Mobile: always (no collapsible hero). */}
        <div
          className={cn(
            "mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-center sm:gap-3",
            !isArchiveOpen && "max-lg:hidden",
          )}
        >
          <label className="relative block min-w-0 flex-1">
            <span className="sr-only">Search archived work orders</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search archived work orders"
              className={archiveSearchInputClass}
              enterKeyHint="search"
            />
          </label>
          <select
            value={sort}
            onChange={(event) => updateSort(event.target.value as ArchiveSortOption)}
            className={cn(archiveControlClass, "w-full shrink-0 sm:w-auto sm:min-w-[11rem]")}
            aria-label="Sort archived records"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3 hidden items-center gap-3 border-b border-border pb-3 lg:flex">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-panel-muted text-xs font-semibold text-foreground">
            {space.photoUrl ? (
              <Image
                src={space.photoUrl}
                alt={space.name}
                width={40}
                height={40}
                unoptimized
                className="h-full w-full object-cover"
              />
            ) : (
              space.name
                .split(" ")
                .map((part) => part.charAt(0))
                .join("")
                .slice(0, 2)
                .toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
              Space archive
            </p>
            <h2 className="truncate text-lg font-semibold tracking-tight text-foreground">
              {space.name}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">
              {spaceTypeLabel ? (
                <span className="rounded-full border border-border bg-panel-muted px-2 py-0.5 font-medium text-foreground">
                  {spaceTypeLabel}
                </span>
              ) : null}
              <span className="tabular-nums">{totalCount} archived</span>
              <span aria-hidden>·</span>
              <span className="tabular-nums">{folders.length} folders</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsArchiveOpen((current) => !current)}
          className="w-full rounded-xl border border-border bg-panel p-4 text-left shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition-colors hover:bg-panel-muted sm:rounded-2xl sm:p-5 lg:hidden"
        >
          <div className="flex flex-col gap-4 sm:gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-start gap-3 sm:gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-panel-muted text-sm font-semibold text-foreground sm:h-16 sm:w-16 sm:rounded-[1.25rem] lg:h-20 lg:w-20 lg:rounded-[1.6rem] lg:text-lg">
                {space.photoUrl ? (
                  <Image
                    src={space.photoUrl}
                    alt={space.name}
                    width={80}
                    height={80}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                ) : (
                  space.name
                    .split(" ")
                    .map((part) => part.charAt(0))
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                )}
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted sm:text-[11px] sm:tracking-[0.26em]">
                  Space archive
                </p>
                <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-foreground sm:mt-2 sm:text-2xl lg:mt-3 lg:text-3xl">
                  {space.name}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:mt-3 sm:gap-2">
                  {spaceTypeLabel ? (
                    <span className="inline-flex rounded-full border border-border bg-panel-muted px-2 py-0.5 text-[11px] font-semibold text-foreground sm:px-3 sm:py-1 sm:text-xs">
                      {spaceTypeLabel}
                    </span>
                  ) : null}
                  <span className="inline-flex rounded-full border border-border bg-panel-muted px-2 py-0.5 text-[11px] font-semibold text-foreground sm:px-3 sm:py-1 sm:text-xs">
                    {totalCount} records
                  </span>
                  <span className="inline-flex rounded-full border border-border bg-panel-muted px-2 py-0.5 text-[11px] font-semibold text-foreground sm:px-3 sm:py-1 sm:text-xs">
                    {folders.length} folders
                  </span>
                </div>
                {space.address ? (
                  <p className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-panel px-2.5 py-1 text-xs text-muted sm:mt-3 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-accent sm:h-4 sm:w-4" aria-hidden />
                    <span className="truncate">{space.address}</span>
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 sm:justify-start xl:self-center">
              <div className="hidden rounded-2xl border border-border bg-panel-muted px-3 py-2 text-left sm:block sm:px-4 sm:py-3 sm:text-right">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted sm:text-[11px] sm:tracking-[0.22em]">
                  Archive view
                </p>
                <p className="mt-1 text-xs font-medium text-foreground sm:mt-2 sm:text-sm">
                  {isArchiveOpen ? "Hide folders and records" : "Open folders and records"}
                </p>
              </div>
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-panel text-foreground sm:h-12 sm:w-12 sm:rounded-2xl">
                {isArchiveOpen ? (
                  <ChevronDown className="h-5 w-5" aria-hidden />
                ) : (
                  <ChevronRight className="h-5 w-5" aria-hidden />
                )}
              </span>
            </div>
          </div>
        </button>

        <div
          className={cn(
            "mt-3 flex flex-col gap-3 sm:mt-4 sm:gap-4 lg:mt-0 lg:min-h-[min(32rem,calc(100vh-14rem))] lg:flex lg:flex-1 lg:flex-col lg:gap-0 lg:overflow-hidden lg:rounded-xl lg:border lg:border-border lg:bg-panel lg:shadow-sm",
            !isArchiveOpen && "max-lg:hidden",
          )}
        >
          <div className="flex min-h-0 flex-1 flex-col gap-3 lg:min-h-0 lg:flex-row lg:gap-0">
            <div className="lg:hidden">
              <div className="flex flex-row items-end gap-2">
                <label className="grid min-w-0 flex-1 gap-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                    Folder
                  </span>
                  <select
                    className={archiveControlClass}
                    value={selectedFolderId ?? ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      router.push(buildFolderHref(value.length > 0 ? value : null));
                    }}
                    aria-label="Choose archive folder"
                  >
                    <option value="">
                      All records ({allArchiveCount})
                    </option>
                    {defaultFolder ? (
                      <option key={defaultFolder.id} value={defaultFolder.id}>
                        {defaultFolder.name} ({defaultFolder.archivedCount})
                      </option>
                    ) : null}
                    {mobileCustomFolderOrder.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {`${"\u2014 ".repeat(Math.max(0, folder.depth))}${folder.name} (${folder.archivedCount})`}
                      </option>
                    ))}
                  </select>
                </label>
                <ArchiveCreateFolderModal
                  returnTo={pathname}
                  folders={folders}
                  defaultParentFolderId={selectedFolderId}
                  spaceId={space.id}
                  triggerClassName="h-10 w-auto shrink-0 touch-manipulation px-3"
                />
              </div>
              <div
                className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                aria-label="Quick folder jumps"
              >
                <Link
                  href={buildFolderHref(null)}
                  className={jumpDestinationClass(!selectedFolderId)}
                >
                  All records
                </Link>
                {defaultFolder ? (
                  <Link
                    href={buildFolderHref(defaultFolder.id)}
                    className={jumpDestinationClass(selectedFolderId === defaultFolder.id)}
                  >
                    {defaultFolder.name}
                  </Link>
                ) : null}
              </div>
            </div>

            <aside className="hidden w-full shrink-0 border-border bg-panel-muted/40 lg:flex lg:min-h-0 lg:w-[min(100%,18rem)] lg:flex-col lg:border-r xl:w-72">
              <div className="shrink-0 border-b border-border px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <FolderTree className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                  <p className="text-xs font-semibold text-foreground">Folders</p>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2 sm:px-3 sm:py-3">
                <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
                  Start here
                </p>
                <div className="mt-2 space-y-1.5">
                  <ArchiveFolderNavItem
                    label="All records"
                    count={allArchiveCount}
                    href={buildFolderHref(null)}
                    icon={Vault}
                    isActive={!selectedFolderId}
                    isSystem
                  />
                  {defaultFolder ? (
                    <ArchiveFolderNavItem
                      label={defaultFolder.name}
                      count={defaultFolder.archivedCount}
                      href={buildFolderHref(defaultFolder.id)}
                      icon={FolderOpen}
                      isActive={selectedFolderId === defaultFolder.id}
                      isSystem
                    />
                  ) : null}
                </div>

                <ArchiveCustomFolderList
                  folders={customFolders}
                  selectedFolderId={selectedFolderId}
                  basePath={pathname}
                  spaceId={space.id}
                  listStyle="sidebar"
                />
              </div>

              <div className="shrink-0 border-t border-border bg-panel px-2 py-2 sm:px-3 sm:py-2.5">
                <ArchiveCreateFolderModal
                  returnTo={pathname}
                  folders={folders}
                  defaultParentFolderId={selectedFolderId}
                  spaceId={space.id}
                />
              </div>
            </aside>

            <div className="flex min-h-0 min-w-0 flex-1 flex-col space-y-3 sm:space-y-4 lg:space-y-0">
              <div className="rounded-lg border border-border bg-panel p-3 shadow-sm sm:rounded-xl sm:p-4 sm:shadow-[0_8px_24px_rgba(15,23,42,0.04)] lg:rounded-none lg:border-0 lg:border-b lg:shadow-none lg:px-4 lg:py-3">
                {/* Mobile: one compact row — full folder title + count (no duplicate subcopy). */}
                <div className="flex items-start justify-between gap-3 lg:hidden">
                  <h3 className="min-w-0 flex-1 text-base font-semibold leading-snug text-foreground break-words">
                    {selectedFolder ? selectedFolder.pathLabel : `${space.name} archive`}
                  </h3>
                  <p className="shrink-0 pt-0.5 text-right text-xs tabular-nums text-muted">
                    <span className="font-medium text-foreground">{items.length}</span>
                    {query.trim() ? (
                      <span className="block text-[10px] font-normal leading-tight">filtered</span>
                    ) : (
                      <span className="block text-[10px] font-normal leading-tight">shown</span>
                    )}
                  </p>
                </div>

                <div className="hidden flex-col gap-2.5 lg:flex">
                  <div className="flex items-start justify-between gap-3">
                    <nav
                      className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1 gap-y-0.5 text-sm text-muted"
                      aria-label="Archive location"
                    >
                      <Link
                        href={buildFolderHref(null)}
                        className="shrink-0 font-medium text-accent hover:underline"
                      >
                        Archive
                      </Link>
                      <ChevronRight className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
                      {selectedFolderTrail.length === 0 ? (
                        <span className="min-w-0 font-semibold text-foreground">All records</span>
                      ) : (
                        selectedFolderTrail.map((folder, index) => {
                          const isLast = index === selectedFolderTrail.length - 1;

                          return (
                            <Fragment key={folder.id}>
                              {index > 0 ? (
                                <ChevronRight
                                  className="h-4 w-4 shrink-0 opacity-50"
                                  aria-hidden
                                />
                              ) : null}
                              {isLast ? (
                                <span
                                  className="min-w-0 truncate font-semibold text-foreground"
                                  title={folder.pathLabel}
                                >
                                  {folder.name}
                                </span>
                              ) : (
                                <Link
                                  href={buildFolderHref(folder.id)}
                                  className="max-w-[min(12rem,45%)] shrink truncate font-medium text-accent hover:underline"
                                  title={folder.pathLabel}
                                >
                                  {folder.name}
                                </Link>
                              )}
                            </Fragment>
                          );
                        })
                      )}
                    </nav>
                    <div className="shrink-0 text-right text-xs tabular-nums text-muted">
                      <span className="font-medium text-foreground">{items.length}</span>
                      {query.trim() ? (
                        <span className="ml-1">filtered</span>
                      ) : (
                        <span className="ml-1">shown</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2" aria-label="Quick folder jumps">
                    <Link
                      href={buildFolderHref(null)}
                      className={jumpDestinationClass(!selectedFolderId)}
                    >
                      All records
                    </Link>
                    {defaultFolder ? (
                      <Link
                        href={buildFolderHref(defaultFolder.id)}
                        className={jumpDestinationClass(selectedFolderId === defaultFolder.id)}
                      >
                        {defaultFolder.name}
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-3 sm:space-y-4 lg:overflow-y-auto lg:px-2 lg:pb-3 lg:pt-1">
              {items.length === 0 ? (
                <section className="grid min-h-[11rem] place-items-center rounded-lg border border-border bg-panel px-4 py-6 shadow-sm sm:min-h-[18rem] sm:rounded-xl sm:px-6 sm:py-8 sm:shadow-[0_8px_24px_rgba(15,23,42,0.04)] lg:min-h-[20rem] lg:rounded-xl lg:py-10 lg:shadow-sm">
                  <div className="max-w-md text-center">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-panel-muted text-accent sm:h-14 sm:w-14 sm:rounded-xl">
                      <Archive className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
                    </div>
                    <h2 className="mt-3 text-base font-semibold text-foreground sm:mt-4 sm:text-xl lg:text-3xl">
                      Nothing here yet
                    </h2>
                    <p className="mt-1.5 text-xs text-muted sm:mt-2 sm:text-sm lg:text-base">
                      {selectedFolder
                        ? "Try another folder or clear search."
                        : `Archived work orders for ${space.name} appear here.`}
                    </p>
                  </div>
                </section>
              ) : (
                <ul className="space-y-2 sm:space-y-4" role="list">
                  {items.map((item) => (
                    <li key={item.id}>
                      <article className="rounded-xl border border-border bg-panel p-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:rounded-2xl sm:p-5 lg:rounded-[2rem] lg:shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex rounded-full border border-border bg-panel-muted px-2 py-0.5 text-[10px] font-semibold text-accent sm:px-3 sm:py-1 sm:text-xs">
                                Archived
                              </span>
                              <h2 className="min-w-0 truncate text-base font-semibold text-foreground sm:text-lg">
                                {item.title}
                              </h2>
                            </div>
                            <p className="mt-1.5 text-xs text-muted sm:mt-2 sm:text-sm">
                              {item.archivedAtLabel} · {item.archivedByName}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-muted sm:mt-1 sm:text-sm">
                              {item.folderName}
                            </p>
                          </div>

                          <Link
                            href={getArchiveRecordHref(item.id)}
                            className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-transparent bg-[#2f5fd4] px-4 text-sm font-medium text-white touch-manipulation hover:bg-[#274fbf] sm:w-auto dark:bg-[#3d6fd9] dark:hover:bg-[#5285e8]"
                          >
                            Open record
                            <ArrowUpRight className="h-4 w-4" aria-hidden />
                          </Link>
                        </div>
                      </article>
                    </li>
                  ))}
                </ul>
              )}
              </div>
            </div>
          </div>
        </div>

        {!isArchiveOpen ? (
          <div className="mt-4 rounded-xl border border-dashed border-border bg-panel px-4 py-6 text-center sm:rounded-2xl sm:px-6 sm:py-10 lg:hidden">
            <p className="text-sm font-medium text-foreground">
              Tap above to open folders and archived records for {space.name}.
            </p>
          </div>
        ) : null}
      </section>
    </MainShell>
  );
}
