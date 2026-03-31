import { LockKeyhole } from "lucide-react";
import { MainShell } from "@/components/layout/main-shell";
import { ArchiveEmptyState } from "@/features/archive/ui/archive-empty-state";
import { ArchiveRecordActions } from "@/features/archive/ui/archive-record-actions";
import { ArchiveToolbar } from "@/features/archive/ui/archive-toolbar";
import type {
  ArchiveFolderOption,
  ArchiveSpaceFilterOption,
  ArchiveSortOption,
  ArchivedWorkOrderItem,
} from "@/features/archive/types/archive";

type ArchiveDashboardProps = Readonly<{
  items: ArchivedWorkOrderItem[];
  folders: ArchiveFolderOption[];
  spaceOptions: ArchiveSpaceFilterOption[];
  selectedFolderId: string | null;
  selectedSpaceId: string | null;
  searchQuery: string;
  sort: ArchiveSortOption;
  totalCount: number;
}>;

export function ArchiveDashboard({
  items,
  folders,
  spaceOptions,
  selectedFolderId,
  selectedSpaceId,
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
      meta={
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-panel-muted px-3 py-1.5 text-sm text-muted">
          <LockKeyhole className="h-4 w-4" />
          {items.length} visible / {totalCount} total
        </span>
      }
      actions={
        <ArchiveToolbar
          items={items}
          searchQuery={searchQuery}
          sort={sort}
          selectedFolderId={selectedFolderId}
          spaceOptions={spaceOptions}
          selectedSpaceId={selectedSpaceId}
        />
      }
    >
      {items.length === 0 ? (
        <ArchiveEmptyState />
      ) : (
        <section className="px-6 py-5 lg:px-8">
          <div className="relative rounded-[24px] border border-border bg-panel">
            <div className="divide-y divide-border">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        <LockKeyhole className="h-3.5 w-3.5" />
                        Archived
                      </span>
                      <span className="truncate text-base font-semibold text-foreground">
                        {item.title}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted">
                      {item.spaceName} / Archived {item.archivedAtLabel}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex rounded-full border border-border bg-panel-muted px-3 py-1.5 text-sm text-foreground">
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
