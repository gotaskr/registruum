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
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
            Recent Activity
          </p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">Latest updates</h2>
          <p className="mt-1 text-sm text-muted">
            {totalCount > logs.length
              ? `Showing the latest ${logs.length} of ${totalCount}`
              : `${totalCount} total activity entries`}
          </p>
        </div>
        <a
          href={getWorkOrderModuleHref(spaceId, workOrderId, "logs")}
          className="text-sm font-medium text-foreground hover:text-muted"
        >
          View all
        </a>
      </div>
      <div className="rounded-2xl bg-panel shadow-[0_10px_30px_rgba(15,23,42,0.05)] ring-1 ring-border">
        {logs.length === 0 ? (
          <div className="px-6 py-6 text-sm text-muted">
            No activity has been recorded for this work order yet.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {logs.map((log) => (
              <div key={log.id} className="px-6 py-4">
                <p className="text-sm font-medium text-foreground">
                  {log.actorName === "System"
                    ? log.action
                    : `${log.actorName} ${log.action.charAt(0).toLowerCase()}${log.action.slice(1)}`}
                </p>
                {log.details ? (
                  <p className="mt-1 text-sm text-muted">{log.details}</p>
                ) : null}
                <p className="mt-1 text-xs text-muted">{log.createdAt}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
