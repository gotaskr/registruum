import { LockKeyhole } from "lucide-react";
import { MainShell } from "@/components/layout/main-shell";
import { ArchiveEmptyState } from "@/features/archive/ui/archive-empty-state";
import { ArchiveHubMobileControls } from "@/features/archive/ui/archive-hub-mobile-controls";
import { ArchiveRecordActions } from "@/features/archive/ui/archive-record-actions";
import { ArchiveToolbar } from "@/features/archive/ui/archive-toolbar";
import type {
  ArchiveFolder,
  ArchiveFolderOption,
  ArchiveSpaceFilterOption,
  ArchiveSortOption,
  ArchivedWorkOrderItem,
} from "@/features/archive/types/archive";
import { cn } from "@/lib/utils";

type ArchiveDashboardProps = Readonly<{
  items: ArchivedWorkOrderItem[];
  folders: ArchiveFolderOption[];
  treeFolders: ArchiveFolder[];
  spaceOptions: ArchiveSpaceFilterOption[];
  selectedFolderId: string | null;
  selectedSpaceId: string | null;
  defaultFolderId: string;
  searchQuery: string;
  sort: ArchiveSortOption;
  totalCount: number;
}>;

export function ArchiveDashboard({
  items,
  folders,
  treeFolders,
  spaceOptions,
  selectedFolderId,
  selectedSpaceId,
  defaultFolderId,
  searchQuery,
  sort,
  totalCount,
}: ArchiveDashboardProps) {
  const returnParams = new URLSearchParams();

  if (selectedFolderId) {
    returnParams.set("folder", selectedFolderId);
  }

  if (selectedSpaceId) {
    returnParams.set("space", selectedSpaceId);
  }

  if (searchQuery) {
    returnParams.set("query", searchQuery);
  }

  returnParams.set("sort", sort);
  const returnTo = `/archive?${returnParams.toString()}`;

  return (
    <MainShell
      title="Archive"
      description="Read-only records vault for finalized work orders."
      descriptionClassName="hidden sm:block"
      meta={
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-panel-muted px-2.5 py-1 text-xs text-muted sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm">
          <LockKeyhole className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="tabular-nums">{items.length}</span>
          <span className="text-muted">/</span>
          <span className="tabular-nums">{totalCount}</span>
        </span>
      }
      actions={
        <div className="w-full min-w-0 lg:w-auto">
          <ArchiveToolbar
            items={items}
            searchQuery={searchQuery}
            sort={sort}
            selectedFolderId={selectedFolderId}
            spaceOptions={spaceOptions}
            selectedSpaceId={selectedSpaceId}
          />
        </div>
      }
    >
      <div className="space-y-3 px-4 pb-6 pt-1 sm:space-y-4 sm:px-6 sm:pb-8 sm:pt-2 lg:px-8">
        <ArchiveHubMobileControls
          treeFolders={treeFolders}
          spaceOptions={spaceOptions}
          selectedFolderId={selectedFolderId}
          selectedSpaceId={selectedSpaceId}
          defaultFolderId={defaultFolderId}
        />
      </div>

      {items.length === 0 ? (
        <ArchiveEmptyState />
      ) : (
        <section className="px-4 pb-10 pt-0 sm:px-6 sm:pb-8 lg:px-8">
          <div className="relative rounded-xl border border-border bg-panel sm:rounded-[24px]">
            <div className="divide-y divide-border">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col gap-3 px-4 py-4 max-sm:gap-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between lg:gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-200">
                        <LockKeyhole className="h-3.5 w-3.5" />
                        Archived
                      </span>
                      <span className="min-w-0 truncate text-base font-semibold text-foreground">
                        {item.title}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted">
                      {item.spaceName} / Archived {item.archivedAtLabel}
                    </p>
                  </div>

                  <div
                    className={cn(
                      "flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3",
                      "max-sm:w-full",
                    )}
                  >
                    <span className="inline-flex w-fit rounded-full border border-border bg-panel-muted px-3 py-1.5 text-sm text-foreground">
                      {item.folderName}
                    </span>
                    <ArchiveRecordActions
                      item={item}
                      folders={folders}
                      returnTo={returnTo}
                    />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </MainShell>
  );
}
