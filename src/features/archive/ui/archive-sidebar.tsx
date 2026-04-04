import { FolderOpen, Vault } from "lucide-react";
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
}>;

export function ArchiveSidebar({
  folders,
  selectedFolderId,
  defaultFolderId,
}: ArchiveSidebarProps) {
  const selectedFolder = folders.find((folder) => folder.id === selectedFolderId) ?? null;
  const customFolders = folders.filter((folder) => !folder.isSystemDefault);
  const allArchiveCount = folders
    .filter((folder) => folder.depth === 0)
    .reduce((total, folder) => total + folder.archivedCount, 0);
  const defaultFolder = folders.find((folder) => folder.id === defaultFolderId) ?? null;

  return (
    <div className="grid h-full min-h-[18rem] grid-rows-[auto_1fr_auto] bg-[#f7f8fa]">
      <div className="border-b border-border px-5 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted">
          Archive Vault
        </p>
        <h1 className="mt-2 text-lg font-semibold tracking-tight text-foreground">Archive</h1>
        <p className="mt-1 text-sm text-muted">
          Read-only records organized by folder.
        </p>
      </div>

      <div className="overflow-y-auto px-4 py-4">
        <div>
          <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
            System Folders
          </p>
          <div className="mt-3 space-y-2">
            <ArchiveFolderNavItem
              label="All Archive"
              count={allArchiveCount}
              href="/archive"
              icon={Vault}
              isActive={!selectedFolderId}
              isSystem
            />
            {defaultFolder ? (
              <ArchiveFolderNavItem
                label={defaultFolder.name}
                count={defaultFolder.archivedCount}
                href={`/archive?folder=${defaultFolder.id}`}
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
        />
      </div>

      <div className="border-t border-border bg-white px-5 py-4">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
            Create Folder
          </p>
          <ArchiveCreateFolderModal
            returnTo="/archive"
            folders={folders}
            defaultParentFolderId={selectedFolderId}
          />
        </div>

        {selectedFolder && !selectedFolder.isSystemDefault ? (
          <details className="mt-4 rounded-xl border border-border bg-[#fbfbfc]">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-foreground">
              Folder options
            </summary>
            <div className="border-t border-border px-4 py-4">
              <form action={renameArchiveFolderAction} className="space-y-3">
                <input type="hidden" name="folderId" value={selectedFolder.id} />
                <input
                  type="hidden"
                  name="returnTo"
                  value={`/archive?folder=${selectedFolder.id}`}
                />
                <label className="block space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
                    Rename
                  </span>
                  <input
                    name="name"
                    type="text"
                    defaultValue={selectedFolder.name}
                    className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none"
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-border bg-white px-4 text-sm font-medium text-foreground"
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
