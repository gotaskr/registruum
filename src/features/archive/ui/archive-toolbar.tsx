"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Download, Search, SlidersHorizontal } from "lucide-react";
import {
  archiveControlClass,
  archiveSearchInputClass,
} from "@/features/archive/lib/archive-form-styles";
import type {
  ArchiveSortOption,
  ArchiveSpaceFilterOption,
  ArchivedWorkOrderItem,
} from "@/features/archive/types/archive";
import { cn } from "@/lib/utils";

type ArchiveToolbarProps = Readonly<{
  items: ArchivedWorkOrderItem[];
  searchQuery: string;
  sort: ArchiveSortOption;
  selectedFolderId: string | null;
  spaceOptions: ArchiveSpaceFilterOption[];
  selectedSpaceId: string | null;
}>;

const sortOptions: ReadonlyArray<{
  value: ArchiveSortOption;
  label: string;
}> = [
  { value: "archived_desc", label: "Newest archived" },
  { value: "archived_asc", label: "Oldest archived" },
];

export function ArchiveToolbar({
  items,
  searchQuery,
  sort,
  selectedFolderId,
  spaceOptions,
  selectedSpaceId,
}: ArchiveToolbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchQuery);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setQuery(searchQuery);
  }, [searchQuery]);

  const buildNextParams = useCallback((input: Readonly<{
    nextQuery?: string;
    nextSort?: ArchiveSortOption;
    nextSpaceId?: string | null;
  }>) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    const nextQuery = input.nextQuery ?? query;
    const nextSort = input.nextSort ?? sort;
    const nextSpaceId =
      input.nextSpaceId === undefined ? selectedSpaceId : input.nextSpaceId;

    if (input.nextSpaceId !== undefined) {
      nextParams.delete("folder");
    } else if (selectedFolderId) {
      nextParams.set("folder", selectedFolderId);
    } else {
      nextParams.delete("folder");
    }

    if (nextQuery.trim().length > 0) {
      nextParams.set("query", nextQuery.trim());
    } else {
      nextParams.delete("query");
    }

    if (nextSpaceId) {
      nextParams.set("space", nextSpaceId);
    } else {
      nextParams.delete("space");
    }

    nextParams.set("sort", nextSort);

    return nextParams;
  }, [query, searchParams, selectedFolderId, selectedSpaceId, sort]);

  function replaceWithParams(nextParams: URLSearchParams) {
    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }

  /** Debounce search text only; full param rebuild was clearing `folder`/`space` when props lagged URL. */
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const nextParams = new URLSearchParams(searchParams.toString());
      if (query.trim().length > 0) {
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

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [menuOpen]);

  function updateSort(nextSort: ArchiveSortOption) {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (query.trim().length > 0) {
      nextParams.set("query", query.trim());
    } else {
      nextParams.delete("query");
    }
    nextParams.set("sort", nextSort);
    replaceWithParams(nextParams);
    setMenuOpen(false);
  }

  function updateSpaceFilter(nextSpaceId: string) {
    const nextParams = buildNextParams({
      nextSpaceId: nextSpaceId.length > 0 ? nextSpaceId : null,
    });
    replaceWithParams(nextParams);
    setMenuOpen(false);
  }

  function handleExport() {
    const rows = [
      ["Work Order", "Space", "Archived Date", "Finalized By", "Folder"],
      ...items.map((item) => [
        item.title,
        item.spaceName,
        item.archivedAtLabel,
        item.archivedByName,
        item.folderName,
      ]),
    ];
    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${value.replaceAll(`"`, `""`)}`)
          .map((value) => `${value}"`)
          .join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStamp = new Date().toISOString().slice(0, 10);

    link.href = objectUrl;
    link.download = `archive-export-${dateStamp}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(objectUrl);
    setMenuOpen(false);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
      <label className="relative block w-full sm:w-[18rem] lg:w-[22rem] xl:w-[24rem]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search archived work orders"
          className={archiveSearchInputClass}
        />
      </label>

      <div className="relative shrink-0" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          className="inline-flex h-10 min-w-[10rem] items-center justify-center gap-2 rounded-lg border border-border bg-panel px-4 text-sm font-medium text-foreground hover:bg-panel-muted"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Options
          <ChevronDown className="h-4 w-4" />
        </button>

        {menuOpen ? (
          <div className="absolute right-0 top-full z-20 mt-1 w-64 rounded-lg border border-border bg-panel p-2 shadow-md">
            <div className="px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
                Sort
              </p>
            </div>
            <div className="space-y-1">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateSort(option.value)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors",
                    sort === option.value
                      ? "bg-panel-muted font-medium text-foreground ring-1 ring-border"
                      : "text-foreground hover:bg-panel-muted",
                  )}
                >
                  <span>{option.label}</span>
                  {sort === option.value ? <span className="text-xs">Active</span> : null}
                </button>
              ))}
            </div>

            <div className="mt-2 border-t border-border pt-2">
              <div className="hidden lg:block">
                <div className="px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
                    Filter
                  </p>
                </div>
                <div className="px-3 pb-2">
                  <label className="block space-y-2">
                    <span className="text-xs font-medium text-muted">Space</span>
                    <select
                      value={selectedSpaceId ?? ""}
                      onChange={(event) => updateSpaceFilter(event.target.value)}
                      className={archiveControlClass}
                    >
                      <option value="">All spaces</option>
                      {spaceOptions.map((space) => (
                        <option key={space.id} value={space.id}>
                          {space.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExport}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-panel-muted"
              >
                <Download className="h-4 w-4" />
                Export current view
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
