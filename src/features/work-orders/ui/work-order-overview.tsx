import { WorkOrderRecentLogs } from "@/features/work-orders/ui/work-order-recent-logs";
import { WorkOrderPhotoCarousel } from "@/features/work-orders/ui/work-order-photo-carousel";
import { StatusBadge } from "@/components/ui/status-badge";
import { SpaceInfoCard } from "@/features/spaces/ui/space-info-card";
import { formatDateLabel, formatWorkOrderLocation } from "@/lib/utils";
import type { WorkOrderOverviewData } from "@/features/work-orders/types/work-order-overview";
import type { WorkOrder } from "@/types/work-order";

type WorkOrderOverviewProps = Readonly<{
  workOrder: WorkOrder;
  overview: WorkOrderOverviewData;
}>;

export function WorkOrderOverview({
  workOrder,
  overview,
}: WorkOrderOverviewProps) {
  return (
    <section className="space-y-8 px-6 py-8 lg:px-8">
      <section className="rounded-2xl bg-panel px-8 py-8 shadow-[0_12px_40px_rgba(15,23,42,0.06)] ring-1 ring-border">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <div className="space-y-6">
            <div className="max-w-3xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                Current Work
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                {workOrder.title}
              </h2>
              <p className="text-base text-muted">
                {workOrder.description?.trim()
                  ? workOrder.description
                  : "No description has been added for this work order yet."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={workOrder.status} />
              <span className="inline-flex rounded-full bg-panel-muted px-3 py-1.5 text-sm text-muted">
                {formatWorkOrderLocation(workOrder.locationLabel, workOrder.unitLabel)}
              </span>
              <span className="inline-flex rounded-full bg-panel-muted px-3 py-1.5 text-sm text-muted">
                Expires {formatDateLabel(workOrder.expirationAt)}
              </span>
              <span className="inline-flex rounded-full bg-panel-muted px-3 py-1.5 text-sm text-muted">
                Created by {overview.createdByName}
              </span>
            </div>
          </div>

          <WorkOrderPhotoCarousel
            photos={overview.photos}
          />
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <SpaceInfoCard
          label="Members"
          value={overview.memberCount}
          helper="Assigned to this work order"
          orientation="horizontal"
        />
        <SpaceInfoCard
          label="Documents"
          value={overview.documentCount}
          helper="Files attached here"
          orientation="horizontal"
        />
        <SpaceInfoCard
          label="Activity"
          value={overview.activityCount}
          helper={workOrder.isPostedToJobMarket ? "Posted to job market" : "Not posted to job market"}
          orientation="horizontal"
        />
      </div>

      <WorkOrderRecentLogs
        spaceId={workOrder.spaceId}
        workOrderId={workOrder.id}
        logs={overview.recentLogs}
        totalCount={overview.activityCount}
      />
    </section>
  );
}
