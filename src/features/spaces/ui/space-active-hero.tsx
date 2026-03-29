"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { getWorkOrderModuleHref } from "@/lib/route-utils";
import { formatWorkOrderLocation } from "@/lib/utils";
import type { WorkOrder } from "@/types/work-order";

type SpaceActiveHeroProps = Readonly<{
  spaceId: string;
  workOrders: WorkOrder[];
}>;

export function SpaceActiveHero({
  spaceId,
  workOrders,
}: SpaceActiveHeroProps) {
  const visibleWorkOrders = workOrders.slice(0, 3);

  return (
    <section className="rounded-2xl bg-panel px-8 py-8 shadow-[0_12px_40px_rgba(15,23,42,0.06)] ring-1 ring-border">
      <div className="space-y-6">
        <div className="max-w-2xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
            Current Work
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">
            Work orders are already in motion
          </h2>
          <p className="text-base text-muted">
            Keep this space moving by checking active work, adding new jobs, and reviewing recent activity.
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          {visibleWorkOrders.map((workOrder) => (
            <article
              key={workOrder.id}
              className="rounded-xl bg-panel-muted px-5 py-4 ring-1 ring-border"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {workOrder.title}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {formatWorkOrderLocation(workOrder.locationLabel, workOrder.unitLabel)}
                  </p>
                </div>
                <StatusBadge status={workOrder.status} />
              </div>
              <Link
                href={getWorkOrderModuleHref(spaceId, workOrder.id, "overview")}
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-foreground"
              >
                Open
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
