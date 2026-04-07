"use client";

import { useState } from "react";
import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { MainShell } from "@/components/layout/main-shell";
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
      <MainShell
        title="Workorders"
        description="Active projects inside this space."
        actions={canCreate ? (
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(31,95,255,0.24)]"
          >
            <Plus className="h-4 w-4" />
            Create Workorder
          </button>
        ) : null}
      >
        {workOrders.length === 0 ? (
          <section className="grid min-h-[calc(100vh-13rem)] place-items-center px-6 py-10">
            <div className="max-w-2xl text-center">
              <h2 className="text-3xl font-semibold text-foreground">
                No active workorders in this space
              </h2>
              <p className="mt-3 text-base text-muted">
                {canCreate
                  ? `This view replaces the old space overview. Create a workorder to start managing projects inside ${space.name}.`
                  : `This space does not have any visible workorders for your current access yet.`}
              </p>
              {canCreate ? (
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(31,95,255,0.24)]"
                >
                  <Plus className="h-4 w-4" />
                  Create Workorder
                </button>
              ) : null}
            </div>
          </section>
        ) : (
          <section className="px-6 py-8 lg:px-8">
            <div className="grid gap-5 xl:grid-cols-2">
              {workOrders.map((workOrder) => (
                <Link
                  key={workOrder.id}
                  href={getWorkOrderModuleHref(space.id, workOrder.id, "overview")}
                  className="group rounded-[2rem] border border-border bg-panel p-6 shadow-[0_18px_36px_rgba(15,23,42,0.05)] transition-transform hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-xl font-semibold text-foreground">
                        {workOrder.title}
                      </p>
                      <p className="mt-2 text-sm text-muted">
                        {formatWorkOrderLocation(
                          workOrder.locationLabel,
                          workOrder.unitLabel,
                        )}
                      </p>
                    </div>
                    <StatusBadge status={workOrder.status} />
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[1.4rem] bg-panel-muted px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted">
                        Priority
                      </p>
                      <p className="mt-2 text-sm font-semibold capitalize text-foreground">
                        {workOrder.priority}
                      </p>
                    </div>
                    <div className="rounded-[1.4rem] bg-panel-muted px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted">
                        Start
                      </p>
                      <p className="mt-2 text-sm font-semibold text-foreground">
                        {formatDateLabel(workOrder.startDate)}
                      </p>
                    </div>
                    <div className="rounded-[1.4rem] bg-panel-muted px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted">
                        Due
                      </p>
                      <p className="mt-2 text-sm font-semibold text-foreground">
                        {formatDateLabel(workOrder.dueDate)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent">
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
