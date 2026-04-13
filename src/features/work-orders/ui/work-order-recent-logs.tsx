import { getWorkOrderModuleHref } from "@/lib/route-utils";
import type { LogEntry } from "@/types/log";

type WorkOrderRecentLogsProps = Readonly<{
  spaceId: string;
  workOrderId: string;
  logs: LogEntry[];
  totalCount: number;
}>;

export function WorkOrderRecentLogs({
  spaceId,
  workOrderId,
  logs,
  totalCount,
}: WorkOrderRecentLogsProps) {
  return (
    <section className="space-y-3 sm:space-y-4">
      <div className="flex items-start justify-between gap-3 sm:items-end">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted sm:text-[11px] sm:tracking-[0.22em]">
            Recent activity
          </p>
          <h2 className="mt-0.5 text-base font-semibold tracking-tight text-foreground sm:mt-1 sm:text-lg">
            Latest updates
          </h2>
          <p className="mt-0.5 text-xs text-muted sm:mt-1 sm:text-sm">
            {totalCount > logs.length
              ? `Latest ${logs.length} of ${totalCount}`
              : `${totalCount} entries`}
          </p>
        </div>
        <a
          href={getWorkOrderModuleHref(spaceId, workOrderId, "logs")}
          className="shrink-0 text-xs font-semibold text-accent sm:text-sm sm:font-medium sm:text-foreground sm:hover:text-muted"
        >
          View all
        </a>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-panel shadow-none sm:rounded-2xl sm:shadow-[0_10px_30px_rgba(15,23,42,0.05)] sm:ring-1 sm:ring-border">
        {logs.length === 0 ? (
          <div className="px-4 py-4 text-sm text-muted sm:px-6 sm:py-6">
            No activity has been recorded for this work order yet.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {logs.map((log) => (
              <div key={log.id} className="px-4 py-3 sm:px-6 sm:py-4">
                <p className="text-sm font-medium leading-snug text-foreground">
                  {log.actorName === "System"
                    ? log.action
                    : `${log.actorName} ${log.action.charAt(0).toLowerCase()}${log.action.slice(1)}`}
                </p>
                {log.details ? (
                  <p className="mt-1 text-xs leading-relaxed text-muted sm:text-sm">{log.details}</p>
                ) : null}
                <p className="mt-1 text-[11px] text-muted sm:text-xs">{log.createdAt}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
