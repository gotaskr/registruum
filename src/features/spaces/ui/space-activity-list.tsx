import type { LogEntry } from "@/types/log";

type SpaceActivityListProps = Readonly<{
  recentActivity: LogEntry[];
}>;

export function SpaceActivityList({
  recentActivity,
}: SpaceActivityListProps) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
          Recent Activity
        </p>
        <h2 className="text-lg font-semibold text-foreground">Latest updates</h2>
      </div>

      <div className="rounded-2xl bg-panel shadow-[0_10px_30px_rgba(15,23,42,0.05)] ring-1 ring-border">
        {recentActivity.length === 0 ? (
          <div className="px-6 py-6 text-sm text-muted">No activity yet</div>
        ) : (
          <div className="divide-y divide-border">
            {recentActivity.map((entry) => (
              <div key={entry.id} className="px-6 py-4">
                <p className="text-sm font-medium text-foreground">
                  {entry.actorName === "System"
                    ? entry.action
                    : `${entry.actorName} ${entry.action.charAt(0).toLowerCase()}${entry.action.slice(1)}`}
                </p>
                <p className="mt-1 text-xs text-muted">{entry.createdAt}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
