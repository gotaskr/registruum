"use client";

import { useState } from "react";
import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { MainShell } from "@/components/layout/main-shell";
import { RealtimeRouteRefresh } from "@/components/realtime/realtime-route-refresh";
import { StatusBadge } from "@/components/ui/status-badge";
import { canCreateWorkOrder } from "@/features/permissions/lib/work-order-permissions";
import { CreateWorkOrderModal } from "@/features/work-orders/ui/create-work-order-modal";
import { getWorkOrderModuleHref } from "@/lib/route-utils";
import { formatDateLabel, formatWorkOrderLocation } from "@/lib/utils";
import type { Space } from "@/types/space";
import type { WorkOrder } from "@/types/work-order";

type SpaceWorkOrdersScreenProps = Readonly<{
  space: Space;
  workOrders: WorkOrder[];
}>;

export function SpaceWorkOrdersScreen({
  space,
  workOrders,
}: SpaceWorkOrdersScreenProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const canCreate = canCreateWorkOrder(space.membershipRole ?? null);

  return (
    <>
      <RealtimeRouteRefresh
        channelName={`space:workorders:${space.id}`}
        subscriptions={[
          { table: "work_orders", filter: `space_id=eq.${space.id}` },
          { table: "work_order_memberships" },
        ]}
      />
      <MainShell
        title="Workorders"
        description="Active projects inside this space."
        actions={canCreate ? (
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(31,95,255,0.24)] dark:shadow-none sm:h-11 lg:w-auto"
          >
            <Plus className="h-4 w-4" />
            Create Workorder
          </button>
        ) : null}
      >
        {workOrders.length === 0 ? (
          <section className="grid min-h-[calc(100dvh-12rem)] place-items-center px-4 py-10 sm:px-6">
            <div className="w-full max-w-md text-center sm:max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                No active workorders in this space
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                {canCreate
                  ? `Create a workorder to start managing projects inside ${space.name}.`
                  : `This space does not have any visible workorders for your access yet.`}
              </p>
              {canCreate ? (
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-8 inline-flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(31,95,255,0.24)] dark:shadow-none sm:h-11 sm:w-auto sm:max-w-none"
                >
                  <Plus className="h-4 w-4" />
                  Create Workorder
                </button>
              ) : null}
            </div>
          </section>
        ) : (
          <section className="px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
            <div className="mx-auto grid max-w-6xl gap-3 sm:gap-5 xl:grid-cols-2">
              {workOrders.map((workOrder) => (
                <Link
                  key={workOrder.id}
                  href={getWorkOrderModuleHref(space.id, workOrder.id, "overview")}
                  className="group flex flex-col rounded-2xl border border-border bg-panel p-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)] transition-[transform,box-shadow] active:scale-[0.99] sm:rounded-[2rem] sm:p-6 sm:shadow-[0_18px_36px_rgba(15,23,42,0.05)] sm:hover:-translate-y-0.5 sm:hover:shadow-[0_22px_44px_rgba(15,23,42,0.08)] dark:shadow-none dark:sm:shadow-none dark:sm:hover:shadow-none"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                        {workOrder.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted sm:mt-2 sm:text-sm">
                        {formatWorkOrderLocation(
                          workOrder.locationLabel,
                          workOrder.unitLabel,
                        )}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <StatusBadge status={workOrder.status} />
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 sm:mt-6 sm:gap-3">
                    <div className="rounded-xl bg-panel-muted px-2 py-2.5 sm:rounded-[1.4rem] sm:px-4 sm:py-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted sm:text-xs sm:tracking-[0.18em]">
                        Priority
                      </p>
                      <p className="mt-1 truncate text-xs font-semibold capitalize text-foreground sm:mt-2 sm:text-sm">
                        {workOrder.priority}
                      </p>
                    </div>
                    <div className="rounded-xl bg-panel-muted px-2 py-2.5 sm:rounded-[1.4rem] sm:px-4 sm:py-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted sm:text-xs sm:tracking-[0.18em]">
                        Start
                      </p>
                      <p className="mt-1 truncate text-xs font-semibold text-foreground sm:mt-2 sm:text-sm">
                        {formatDateLabel(workOrder.startDate)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-panel-muted px-2 py-2.5 sm:rounded-[1.4rem] sm:px-4 sm:py-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted sm:text-xs sm:tracking-[0.18em]">
                        Due
                      </p>
                      <p className="mt-1 truncate text-xs font-semibold text-foreground sm:mt-2 sm:text-sm">
                        {formatDateLabel(workOrder.dueDate)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-accent-soft py-2.5 text-sm font-semibold text-accent transition-colors group-hover:bg-accent group-hover:text-white sm:mt-6 sm:w-auto sm:justify-start sm:bg-transparent sm:py-0 sm:group-hover:bg-transparent sm:group-hover:text-accent">
                    Open project
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </MainShell>

      {canCreate ? (
        <CreateWorkOrderModal
          open={isCreateModalOpen}
          spaceId={space.id}
          onClose={() => setIsCreateModalOpen(false)}
        />
      ) : null}
    </>
  );
}
