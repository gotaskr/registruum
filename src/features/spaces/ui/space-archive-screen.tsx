"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
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
import { ArchiveCreateFolderModal } from "@/features/archive/ui/archive-create-folder-modal";
import { ArchiveCustomFolderList } from "@/features/archive/ui/archive-custom-folder-list";
import { ArchiveFolderNavItem } from "@/features/archive/ui/archive-folder-nav-item";
import type {
  ArchiveFolder,
  ArchiveSortOption,
  ArchivedWorkOrderItem,
} from "@/features/archive/types/archive";
import { getSpaceTypeLabel } from "@/features/spaces/lib/space-types";
import { getArchiveRecordHref } from "@/lib/route-utils";
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
  const [isArchiveOpen, setIsArchiveOpen] = useState(
    Boolean(selectedFolderId || searchQuery),
  );

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

  useEffect(() => {
    setQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const nextParams = new URLSearchParams(searchParams.toString());

      if (query.trim()) {
        nextParams.set("query", query.trim());
      } else {
        nextParams.delete("query");
      }

      if (selectedFolderId) {
        nextParams.set("folder", selectedFolderId);
      } else {
        nextParams.delete("folder");
      }

      nextParams.set("sort", sort);
      const nextQuery = nextParams.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    }, 220);

    return () => window.clearTimeout(timeout);
  }, [pathname, query, router, searchParams, selectedFolderId, sort]);

  function updateSort(nextSort: ArchiveSortOption) {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (query.trim()) {
      nextParams.set("query", query.trim());
    } else {
      nextParams.delete("query");
    }

    if (selectedFolderId) {
      nextParams.set("folder", selectedFolderId);
    } else {
      nextParams.delete("folder");
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

    nextParams.set("sort", sort);
    const nextQuery = nextParams.toString();
    return nextQuery ? `${pathname}?${nextQuery}` : pathname;
  }

  return (
    <MainShell
      title="Archive"
      description="Open this space archive to browse folders, subfolders, and archived records."
      meta={
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-panel-muted px-3 py-1.5 text-sm font-medium text-accent">
          <Archive className="h-4 w-4" />
          {items.length} visible / {totalCount} archived in {space.name}
        </span>
      }
      actions={isArchiveOpen ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative block w-full sm:w-[20rem]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search archived workorders"
              className="h-11 w-full rounded-2xl border border-border bg-panel pl-10 pr-3 text-sm text-foreground outline-none"
            />
          </label>
          <select
            value={sort}
            onChange={(event) => updateSort(event.target.value as ArchiveSortOption)}
            className="h-11 rounded-2xl border border-border bg-panel px-4 text-sm text-foreground outline-none"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    >
      <section className="px-6 py-8 lg:px-8">
        <button
          type="button"
          onClick={() => setIsArchiveOpen((current) => !current)}
          className="w-full rounded-[2rem] border border-border bg-panel p-6 text-left shadow-[0_18px_36px_rgba(15,23,42,0.05)] transition-transform transition-shadow hover:-translate-y-0.5 hover:shadow-[0_22px_44px_rgba(15,23,42,0.08)]"
        >
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[1.6rem] border border-border bg-panel-muted text-lg font-semibold text-foreground">
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
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-muted">
                  Space Archive
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                  {space.name}
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {spaceTypeLabel ? (
                    <span className="inline-flex rounded-full border border-border bg-panel-muted px-3 py-1 text-xs font-semibold text-foreground">
                      {spaceTypeLabel}
                    </span>
                  ) : null}
                  <span className="inline-flex rounded-full border border-border bg-panel-muted px-3 py-1 text-xs font-semibold text-foreground">
                    {totalCount} archived records
                  </span>
                  <span className="inline-flex rounded-full border border-border bg-panel-muted px-3 py-1 text-xs font-semibold text-foreground">
                    {folders.length} folders
                  </span>
                </div>
                {space.address ? (
                  <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-panel px-3 py-1.5 text-sm text-muted">
                    <MapPin className="h-4 w-4 text-accent" />
                    {space.address}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-3 self-start xl:self-center">
              <div className="rounded-2xl border border-border bg-panel-muted px-4 py-3 text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
                  Archive View
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {isArchiveOpen ? "Hide folders and records" : "Open folders and records"}
                </p>
              </div>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-panel text-foreground">
                {isArchiveOpen ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </span>
            </div>
          </div>
        </button>

        {isArchiveOpen ? (
          <div className="mt-6 grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
            <aside className="rounded-[2rem] border border-border bg-panel shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
              <div className="border-b border-border px-5 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-panel-muted text-accent">
                    <FolderTree className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
                      Folder Tree
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Browse folders and collapse subfolders as needed.
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-4 py-4">
                <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
                  System Folders
                </p>
                <div className="mt-3 space-y-2">
                  <ArchiveFolderNavItem
                    label="All Archive"
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
                />
              </div>

              <div className="border-t border-border px-5 py-4">
                <ArchiveCreateFolderModal
                  returnTo={pathname}
                  folders={folders}
                  defaultParentFolderId={selectedFolderId}
                  spaceId={space.id}
                />
              </div>
            </aside>

            <div className="space-y-4">
              <div className="rounded-[2rem] border border-border bg-panel p-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
                      Current View
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold text-foreground">
                      {selectedFolder ? selectedFolder.pathLabel : `${space.name} archive`}
                    </h3>
                    <p className="mt-2 text-sm text-muted">
                      {selectedFolder
                        ? `Browsing archived records inside ${selectedFolder.pathLabel}.`
                        : `Browsing all archived folders and records for ${space.name}.`}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-panel-muted px-4 py-3 text-sm text-muted">
                    <p className="font-medium text-foreground">{items.length} visible records</p>
                    <p className="mt-1">Use the tree to move deeper into subfolders.</p>
                  </div>
                </div>
              </div>

              {items.length === 0 ? (
                <section className="grid min-h-[28rem] place-items-center rounded-[2rem] border border-border bg-panel px-6 py-10 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
                  <div className="max-w-2xl text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.75rem] border border-border bg-panel-muted text-accent">
                      <Archive className="h-7 w-7" />
                    </div>
                    <h2 className="mt-6 text-3xl font-semibold text-foreground">
                      Nothing archived in this view yet
                    </h2>
                    <p className="mt-3 text-base text-muted">
                      {selectedFolder
                        ? `There are no archived records inside ${selectedFolder.pathLabel} yet.`
                        : `Archived workorders for ${space.name} will appear here once records are stored in this space archive.`}
                    </p>
                  </div>
                </section>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-[2rem] border border-border bg-panel p-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)]"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex rounded-full border border-border bg-panel-muted px-3 py-1 text-xs font-semibold text-accent">
                              Archived
                            </span>
                            <h2 className="truncate text-lg font-semibold text-foreground">
                              {item.title}
                            </h2>
                          </div>
                          <p className="mt-2 text-sm text-muted">
                            Archived {item.archivedAtLabel} by {item.archivedByName}
                          </p>
                          <p className="mt-1 text-sm text-muted">
                            Folder path: {item.folderName}
                          </p>
                        </div>

                        <Link
                          href={getArchiveRecordHref(item.id)}
                          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-2xl border border-border bg-panel-muted px-4 text-sm font-semibold text-foreground"
                        >
                          Open record
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-[2rem] border border-dashed border-border bg-panel px-6 py-10 text-center">
            <p className="text-sm font-medium text-foreground">
              Click the {space.name} archive card to open this space’s folders and archived records.
            </p>
          </div>
        )}
      </section>
    </MainShell>
  );
}
