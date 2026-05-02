import { WorkOrderRecentLogs } from "@/features/work-orders/ui/work-order-recent-logs";
import { WorkOrderPhotoCarousel } from "@/features/work-orders/ui/work-order-photo-carousel";
import { WorkOrderOverviewHeroMenu } from "@/features/work-orders/ui/work-order-overview-hero-menu";
import { WorkOrderOverviewLifecycleActions } from "@/features/work-orders/ui/work-order-overview-lifecycle-actions";
import { StatusBadge } from "@/components/ui/status-badge";
import { SpaceInfoCard } from "@/features/spaces/ui/space-info-card";
import type { ArchiveFolderOption } from "@/features/archive/types/archive";
import type { WorkOrderPermissionSet } from "@/features/permissions/lib/work-order-permissions";
import { formatDateLabel, formatWorkOrderLocation } from "@/lib/utils";
import type { WorkOrderOverviewData } from "@/features/work-orders/types/work-order-overview";
import type { WorkOrder } from "@/types/work-order";

type WorkOrderOverviewProps = Readonly<{
  workOrder: WorkOrder;
  overview: WorkOrderOverviewData;
  permissions: WorkOrderPermissionSet;
  archiveFolders: ArchiveFolderOption[];
  defaultArchiveFolderId: string;
}>;

function OverviewStatChip({
  label,
  value,
  hint,
}: Readonly<{ label: string; value: number; hint: string }>) {
  return (
    <div className="flex min-w-0 flex-col rounded-xl border border-border bg-panel px-2.5 py-2.5 text-center shadow-none">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted">{hint}</p>
    </div>
  );
}

export function WorkOrderOverview({
  workOrder,
  overview,
  permissions,
  archiveFolders,
  defaultArchiveFolderId,
}: WorkOrderOverviewProps) {
  return (
    <section className="space-y-4 px-4 py-4 sm:space-y-6 sm:px-6 sm:py-6 lg:space-y-8 lg:px-8 lg:py-8">
      <section className="rounded-xl border border-border bg-panel px-4 py-4 shadow-none sm:rounded-2xl sm:px-6 sm:py-6 sm:shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:ring-1 sm:ring-border lg:px-8 lg:py-8">
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-8">
          <div className="min-w-0 space-y-3 sm:space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="max-w-3xl min-w-0 space-y-2 sm:space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted sm:text-xs sm:tracking-[0.24em]">
                  Current work
                </p>
                <h2 className="text-xl font-semibold leading-snug tracking-tight text-foreground sm:text-2xl lg:text-3xl">
                  {workOrder.title}
                </h2>
                <p className="text-sm leading-relaxed text-muted sm:text-base">
                  {workOrder.description?.trim()
                    ? workOrder.description
                    : "No description has been added for this work order yet."}
                </p>
              </div>
              {permissions.canDeleteWorkOrder ? (
                <WorkOrderOverviewHeroMenu workOrder={workOrder} />
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3">
              <StatusBadge status={workOrder.status} />
              <span className="inline-flex max-w-full items-center rounded-full bg-panel-muted px-2.5 py-1 text-xs text-muted sm:px-3 sm:py-1.5 sm:text-sm">
                <span className="truncate">
                  {formatWorkOrderLocation(workOrder.locationLabel, workOrder.unitLabel)}
                </span>
              </span>
              <span className="inline-flex rounded-full bg-panel-muted px-2.5 py-1 text-xs text-muted sm:px-3 sm:py-1.5 sm:text-sm">
                Expires {formatDateLabel(workOrder.expirationAt)}
              </span>
              <span className="inline-flex max-w-full items-center rounded-full bg-panel-muted px-2.5 py-1 text-xs text-muted sm:px-3 sm:py-1.5 sm:text-sm">
                <span className="truncate">By {overview.createdByName}</span>
              </span>
            </div>

            <WorkOrderOverviewLifecycleActions
              workOrder={workOrder}
              permissions={permissions}
              archiveFolders={archiveFolders}
              defaultArchiveFolderId={defaultArchiveFolderId}
            />
          </div>

          <WorkOrderPhotoCarousel photos={overview.photos} />
        </div>
      </section>

      <div className="grid grid-cols-3 gap-2 md:hidden">
        <OverviewStatChip
          label="Members"
          value={overview.memberCount}
          hint="On this order"
        />
        <OverviewStatChip
          label="Docs"
          value={overview.documentCount}
          hint="Attached"
        />
        <OverviewStatChip
          label="Activity"
          value={overview.activityCount}
          hint="Log entries"
        />
      </div>

      <div className="hidden gap-4 md:grid md:grid-cols-3">
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
          helper={
            workOrder.isPostedToJobMarket
              ? "Posted to job market"
              : "Team updates & history"
          }
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
