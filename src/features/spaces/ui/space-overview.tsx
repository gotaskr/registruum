"use client";

import { useState } from "react";
import { MainShell } from "@/components/layout/main-shell";
import { SpaceActiveHero } from "@/features/spaces/ui/space-active-hero";
import { SpaceActivityList } from "@/features/spaces/ui/space-activity-list";
import { SpaceEmptyHero } from "@/features/spaces/ui/space-empty-hero";
import { SpaceInfoCard } from "@/features/spaces/ui/space-info-card";
import { SpaceMembersCard } from "@/features/spaces/ui/space-members-card";
import type { SpaceOverviewMember } from "@/features/spaces/types/space-overview";
import { CreateWorkOrderModal } from "@/features/work-orders/ui/create-work-order-modal";
import type { LogEntry } from "@/types/log";
import type { Space } from "@/types/space";
import type { WorkOrder } from "@/types/work-order";

type SpaceOverviewProps = Readonly<{
  space: Space;
  workOrders: WorkOrder[];
  members: SpaceOverviewMember[];
  recentActivity: LogEntry[];
}>;

function getSpaceRoleLabel(role: Space["membershipRole"]) {
  return role === "admin" ? "Admin" : "User";
}

export function SpaceOverview({
  space,
  workOrders,
  members,
  recentActivity,
}: SpaceOverviewProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <MainShell
      title={space.name}
      description="Space overview"
      actions={
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm"
        >
          Create Work Order
        </button>
      }
    >
      <>
        <section className="space-y-8 px-6 py-8 lg:px-8">
          {workOrders.length === 0 ? (
            <SpaceEmptyHero onCreateWorkOrder={() => setIsCreateModalOpen(true)} />
          ) : (
            <SpaceActiveHero spaceId={space.id} workOrders={workOrders} />
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <SpaceInfoCard
              label="Work Orders"
              value={workOrders.length}
              helper={workOrders.length === 0 ? "Nothing active yet" : "Tracked in this space"}
              orientation="horizontal"
            />
            <SpaceMembersCard members={members} />
            <SpaceInfoCard
              label="Role"
              value={getSpaceRoleLabel(space.membershipRole)}
              helper="Access level in this space"
              orientation="horizontal"
            />
          </div>

          <SpaceActivityList recentActivity={recentActivity} />
        </section>

        <CreateWorkOrderModal
          open={isCreateModalOpen}
          spaceId={space.id}
          onClose={() => setIsCreateModalOpen(false)}
        />
      </>
    </MainShell>
  );
}
