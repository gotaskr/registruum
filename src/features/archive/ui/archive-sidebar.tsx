import { FolderOpen, FolderTree, Vault } from "lucide-react";
import {
  renameArchiveFolderAction,
} from "@/features/archive/actions/archive.actions";
import type { ArchiveFolder } from "@/features/archive/types/archive";
import { ArchiveCreateFolderModal } from "@/features/archive/ui/archive-create-folder-modal";
import { ArchiveCustomFolderList } from "@/features/archive/ui/archive-custom-folder-list";
import { ArchiveFolderNavItem } from "@/features/archive/ui/archive-folder-nav-item";

type ArchiveSidebarProps = Readonly<{
  folders: ArchiveFolder[];
  selectedFolderId: string | null;
  defaultFolderId: string;
  basePath?: string;
  selectedSpaceId?: string | null;
  allArchiveCount?: number;
}>;

export function ArchiveSidebar({
  folders,
  selectedFolderId,
  defaultFolderId,
  basePath = "/archive",
  selectedSpaceId = null,
  allArchiveCount: allArchiveCountOverride,
}: ArchiveSidebarProps) {
  const selectedFolder = folders.find((folder) => folder.id === selectedFolderId) ?? null;
  const customFolders = folders.filter((folder) => !folder.isSystemDefault);
  const allArchiveCount =
    allArchiveCountOverride ??
    folders
      .filter((folder) => folder.depth === 0)
      .reduce((total, folder) => total + folder.archivedCount, 0);
  const defaultFolder = folders.find((folder) => folder.id === defaultFolderId) ?? null;
  const canManageFolders = Boolean(selectedSpaceId);

  function buildHref(folderId: string | null) {
    const searchParams = new URLSearchParams();

    if (selectedSpaceId) {
      searchParams.set("space", selectedSpaceId);
    }

    if (folderId) {
      searchParams.set("folder", folderId);
    }

    const nextQuery = searchParams.toString();
    return nextQuery ? `${basePath}?${nextQuery}` : basePath;
  }

  return (
    <div className="grid h-full min-h-[18rem] grid-rows-[auto_1fr_auto] gap-4 bg-transparent">
      <div className="rounded-[2rem] border border-border bg-panel px-5 py-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-[1.35rem] bg-accent-soft text-accent">
          <Vault className="h-5 w-5" />
        </div>
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-muted">
          Archive Vault
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Archive</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Browse read-only records, move through nested folders, and reopen archived work history.
        </p>
        <div className="mt-4 rounded-[1.5rem] border border-border bg-panel-muted px-4 py-3">
          <div className="flex items-start gap-3">
            <FolderTree className="mt-0.5 h-4 w-4 text-accent" />
            <div>
              <p className="text-sm font-semibold text-foreground">{allArchiveCount} archived records</p>
              <p className="mt-1 text-sm text-muted">
                Use the tree to jump between folders and collapse subfolders as needed.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-0 overflow-y-auto rounded-[2rem] border border-border bg-panel px-4 py-4 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
        <div>
          <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
            System Folders
          </p>
          <div className="mt-3 space-y-2">
            <ArchiveFolderNavItem
              label="All Archive"
              count={allArchiveCount}
              href={buildHref(null)}
              icon={Vault}
              isActive={!selectedFolderId}
              isSystem
            />
            {defaultFolder ? (
              <ArchiveFolderNavItem
                label={defaultFolder.name}
                count={defaultFolder.archivedCount}
                href={buildHref(defaultFolder.id)}
                icon={FolderOpen}
                isActive={selectedFolderId === defaultFolder.id}
                isSystem
              />
            ) : null}
          </div>
        </div>

        <ArchiveCustomFolderList
          folders={customFolders}
          selectedFolderId={selectedFolderId}
          basePath={basePath}
          spaceId={selectedSpaceId}
        />
      </div>

      <div className="rounded-[2rem] border border-border bg-panel px-5 py-4 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
            Create Folder
          </p>
          <ArchiveCreateFolderModal
            returnTo={buildHref(selectedFolderId)}
            folders={folders}
            defaultParentFolderId={selectedFolderId}
            spaceId={selectedSpaceId}
            disabled={!canManageFolders}
          />
          {!canManageFolders ? (
            <p className="text-sm text-muted">
              Select a space from the archive filter before managing folders.
            </p>
          ) : null}
        </div>

        {selectedFolder && !selectedFolder.isSystemDefault && canManageFolders ? (
          <details className="mt-4 rounded-[1.5rem] border border-border bg-panel-muted/60">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-foreground">
              Folder options
            </summary>
            <div className="border-t border-border px-4 py-4">
              <form action={renameArchiveFolderAction} className="space-y-3">
                <input type="hidden" name="folderId" value={selectedFolder.id} />
                <input type="hidden" name="spaceId" value={selectedSpaceId ?? ""} />
                <input
                  type="hidden"
                  name="returnTo"
                  value={buildHref(selectedFolder.id)}
                />
                <label className="block space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
                    Rename
                  </span>
                  <input
                    name="name"
                    type="text"
                    defaultValue={selectedFolder.name}
                    className="h-11 w-full rounded-2xl border border-border bg-panel px-4 text-sm text-foreground outline-none transition-colors focus:border-border-strong"
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-border bg-panel px-4 text-sm font-semibold text-foreground transition-colors hover:bg-panel-muted"
                >
                  Save Name
                </button>
              </form>

            </div>
          </details>
        ) : null}
      </div>
    </div>
  );
}
