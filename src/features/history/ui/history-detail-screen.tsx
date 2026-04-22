import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { MainShell } from "@/components/layout/main-shell";
import type { HistoryDetail } from "@/features/history/api/history";
import { formatRoleLabel, formatWorkOrderLocation } from "@/lib/utils";

type HistoryDetailScreenProps = Readonly<{
  detail: HistoryDetail;
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

function formatWorkOrderStatus(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function HistoryDetailScreen({ detail }: HistoryDetailScreenProps) {
  const { history, liveWorkOrder } = detail;
  const canOpenInSpace = Boolean(history.workOrderId) && Boolean(history.spaceId);
  const locationLine =
    liveWorkOrder != null
      ? formatWorkOrderLocation(liveWorkOrder.locationLabel, liveWorkOrder.unitLabel)
      : null;

  return (
    <MainShell
      title={history.workOrderTitleSnapshot}
      description="Read-only completion record. Summary is from when the work order was marked completed."
      meta={
        <Link
          href="/history"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to History
        </Link>
      }
      contentClassName="bg-panel"
    >
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <section className="rounded-2xl border border-border bg-panel p-4 shadow-sm sm:p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Completion record
          </h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Space</dt>
              <dd className="mt-0.5 font-medium text-foreground">{history.spaceNameSnapshot}</dd>
            </div>
            <div>
              <dt className="text-muted">Completed on</dt>
              <dd className="mt-0.5 font-medium text-foreground">
                {formatCompletedDate(history.completedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Your role then</dt>
              <dd className="mt-0.5 font-medium text-foreground">
                {formatRoleLabel(history.roleSnapshot)}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Title (snapshot)</dt>
              <dd className="mt-0.5 font-medium text-foreground">{history.workOrderTitleSnapshot}</dd>
            </div>
          </dl>
        </section>

        {liveWorkOrder ? (
          <section className="rounded-2xl border border-border bg-panel p-4 shadow-sm sm:p-6">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
              Work order details
            </h2>
            <p className="mt-1 text-xs text-muted">
              Current data from the space (read-only view). You can open the full work order in the
              space when you still have access.
            </p>
            <dl className="mt-4 grid gap-4 text-sm">
              <div>
                <dt className="text-muted">Title</dt>
                <dd className="mt-0.5 font-medium text-foreground">{liveWorkOrder.title}</dd>
              </div>
              <div>
                <dt className="text-muted">Status</dt>
                <dd className="mt-0.5 font-medium text-foreground">
                  {formatWorkOrderStatus(liveWorkOrder.status)}
                </dd>
              </div>
              {liveWorkOrder.subject ? (
                <div>
                  <dt className="text-muted">Subject</dt>
                  <dd className="mt-0.5 text-foreground">{liveWorkOrder.subject}</dd>
                </div>
              ) : null}
              {locationLine && locationLine !== "No location set" ? (
                <div>
                  <dt className="text-muted">Location</dt>
                  <dd className="mt-0.5 text-foreground">{locationLine}</dd>
                </div>
              ) : null}
              {liveWorkOrder.description ? (
                <div>
                  <dt className="text-muted">Description</dt>
                  <dd className="mt-0.5 whitespace-pre-wrap text-foreground">
                    {liveWorkOrder.description}
                  </dd>
                </div>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-muted">Priority</dt>
                  <dd className="mt-0.5 capitalize text-foreground">{liveWorkOrder.priority}</dd>
                </div>
                <div>
                  <dt className="text-muted">Subject type</dt>
                  <dd className="mt-0.5 capitalize text-foreground">{liveWorkOrder.subjectType}</dd>
                </div>
              </div>
            </dl>
          </section>
        ) : (
          <section className="rounded-2xl border border-dashed border-border bg-panel-muted/30 px-4 py-5 text-sm text-muted sm:px-6">
            Live work order details are not available. The job may have been removed, archived
            under different access rules, or you may no longer be a member of that space. Your
            completion record above is unchanged.
          </section>
        )}

        {canOpenInSpace ? (
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/space/${history.spaceId}/work-order/${history.workOrderId}/overview`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-transparent bg-[#2f5fd4] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#274fbf] dark:bg-[#3d6fd9] dark:hover:bg-[#5285e8]"
            >
              Open in space
              <ExternalLink className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        ) : null}
      </div>
    </MainShell>
  );
}
