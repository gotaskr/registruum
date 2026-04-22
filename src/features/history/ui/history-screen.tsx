import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { MainShell } from "@/components/layout/main-shell";
import type { CompletedWorkOrderHistoryItem } from "@/features/history/api/history";
import { formatRoleLabel } from "@/lib/utils";

type HistoryScreenProps = Readonly<{
  items: CompletedWorkOrderHistoryItem[];
}>;

function formatCompletedDate(iso: string) {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function HistoryScreen({ items }: HistoryScreenProps) {
  return (
    <MainShell
      title="History"
      description="A permanent, read-only list of work orders you were part of when they were marked completed. Open a title or View record to see details; use Open in space when you still have access there."
      contentClassName="bg-panel"
    >
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        {items.length === 0 ? (
          <section className="rounded-2xl border border-border bg-panel-muted/40 px-6 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-panel text-accent">
              <ClipboardList className="h-6 w-6" aria-hidden />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-foreground">No completed work yet</h2>
            <p className="mt-2 text-sm text-muted">
              When a work order you are on is marked completed, it will appear here automatically.
            </p>
          </section>
        ) : (
          <ul className="space-y-3" role="list">
            {items.map((item) => {
              const canOpenWorkOrder =
                Boolean(item.workOrderId) && Boolean(item.spaceId);

              return (
                <li key={item.id}>
                  <article className="rounded-2xl border border-border bg-panel p-4 shadow-sm sm:p-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <h2 className="text-base font-semibold text-foreground">
                          <Link
                            href={`/history/${item.id}`}
                            className="text-accent hover:underline"
                          >
                            {item.workOrderTitleSnapshot}
                          </Link>
                        </h2>
                        <p className="mt-1 text-sm text-muted">{item.spaceNameSnapshot}</p>
                        <p className="mt-2 text-xs text-muted">
                          Completed {formatCompletedDate(item.completedAt)} ·{" "}
                          <span className="font-medium text-foreground">
                            {formatRoleLabel(item.roleSnapshot)}
                          </span>
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                        <Link
                          href={`/history/${item.id}`}
                          className="inline-flex items-center justify-center rounded-xl border border-border bg-panel px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-panel-muted"
                        >
                          View record
                        </Link>
                        {canOpenWorkOrder ? (
                          <Link
                            href={`/space/${item.spaceId}/work-order/${item.workOrderId}/overview`}
                            className="inline-flex items-center justify-center rounded-xl border border-border bg-panel-muted px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-panel"
                          >
                            Open in space
                          </Link>
                        ) : null}
                      </div>
                    </div>
                    {!canOpenWorkOrder ? (
                      <p className="mt-2 text-xs text-muted">
                        Record only — the work order is no longer linked in the space. You can
                        still open the completion record above.
                      </p>
                    ) : null}
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </MainShell>
  );
}
