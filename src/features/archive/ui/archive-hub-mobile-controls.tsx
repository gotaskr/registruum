"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { archiveControlClass } from "@/features/archive/lib/archive-form-styles";
import type { ArchiveFolder, ArchiveSpaceFilterOption } from "@/features/archive/types/archive";
type ArchiveHubMobileControlsProps = Readonly<{
  treeFolders: ArchiveFolder[];
  spaceOptions: ArchiveSpaceFilterOption[];
  selectedFolderId: string | null;
  selectedSpaceId: string | null;
  defaultFolderId: string;
}>;

export function ArchiveHubMobileControls({
  treeFolders,
  spaceOptions,
  selectedFolderId,
  selectedSpaceId,
  defaultFolderId,
}: ArchiveHubMobileControlsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const customFolders = useMemo(
    () => treeFolders.filter((folder) => !folder.isSystemDefault),
    [treeFolders],
  );

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

  const allArchiveCount = useMemo(
    () =>
      treeFolders
        .filter((folder) => folder.depth === 0)
        .reduce((total, folder) => total + folder.archivedCount, 0),
    [treeFolders],
  );

  const defaultFolder = useMemo(
    () => treeFolders.find((folder) => folder.id === defaultFolderId) ?? null,
    [defaultFolderId, treeFolders],
  );

  function buildListHref(nextSpaceId: string | null, nextFolderId: string | null) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextSpaceId) {
      params.set("space", nextSpaceId);
    } else {
      params.delete("space");
    }

    if (nextFolderId) {
      params.set("folder", nextFolderId);
    } else {
      params.delete("folder");
    }

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  return (
    <div className="space-y-3 lg:hidden">
      {spaceOptions.length > 0 ? (
        <label className="grid gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            Space
          </span>
          <select
            className={archiveControlClass}
            value={selectedSpaceId ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              router.push(
                buildListHref(value.length > 0 ? value : null, null),
              );
            }}
            aria-label="Filter archive by space"
          >
            <option value="">All spaces</option>
            {spaceOptions.map((space) => (
              <option key={space.id} value={space.id}>
                {space.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {selectedSpaceId ? (
        <label className="grid gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            Folder
          </span>
          <select
            className={archiveControlClass}
            value={selectedFolderId ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              router.push(
                buildListHref(selectedSpaceId, value.length > 0 ? value : null),
              );
            }}
            aria-label="Choose archive folder"
          >
            <option value="">
              All archive ({allArchiveCount})
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
      ) : (
        <p className="rounded-lg border border-dashed border-border bg-panel-muted/50 px-3 py-2 text-xs text-muted">
          Select a space to browse folders.
        </p>
      )}
    </div>
  );
}
