import { MainShell } from "@/components/layout/main-shell";
import { getSpaceTypeLabel } from "@/features/spaces/lib/space-types";
import { SpaceProfileForm } from "@/features/spaces/ui/rename-space-form";
import { SpaceAvatar } from "@/features/spaces/ui/space-avatar";
import { SpaceDeleteMenu } from "@/features/spaces/ui/space-delete-menu";
import { formatRoleLabel } from "@/lib/utils";
import type { Space } from "@/types/space";
import type { WorkOrder } from "@/types/work-order";

type SpaceSettingsScreenProps = Readonly<{
  space: Space;
  workOrders: WorkOrder[];
}>;

export function SpaceSettingsScreen({
  space,
  workOrders,
}: SpaceSettingsScreenProps) {
  const unfinishedWorkOrderCount = workOrders.filter(
    (workOrder) => workOrder.status !== "completed" && workOrder.status !== "archived",
  ).length;

  return (
    <MainShell
      title="Space Settings"
      description="Manage the active space profile, details, and access."
      actions={
        space.membershipRole === "admin" ? (
          <SpaceDeleteMenu
            spaceId={space.id}
            spaceName={space.name}
            unfinishedWorkOrderCount={unfinishedWorkOrderCount}
          />
        ) : undefined
      }
    >
      <section className="space-y-6 px-6 py-8 lg:px-8">
        <div className="rounded-[2rem] border border-[#dbe4f0] bg-white p-6 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
          <div className="flex items-start gap-4">
            <SpaceAvatar
              name={space.name}
              photoUrl={space.photoUrl}
              className="h-20 w-20 rounded-[1.75rem]"
              fallbackClassName="border border-[#dbe4f0]"
            />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8093af]">
                Space Profile
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">{space.name}</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {space.spaceType ? (
                  <span className="inline-flex rounded-full bg-[#f6f9ff] px-3 py-1 text-xs font-semibold text-[#5f718b]">
                    {getSpaceTypeLabel(space.spaceType)}
                  </span>
                ) : null}
                {space.address ? (
                  <span className="inline-flex rounded-full bg-[#eef3ff] px-3 py-1 text-xs font-semibold text-[#2f5fd4]">
                    {space.address}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-[2rem] border border-[#dbe4f0] bg-white px-5 py-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
            <p className="text-xs uppercase tracking-[0.18em] text-[#8aa0be]">Role</p>
            <p className="mt-3 text-xl font-semibold text-foreground">
              {space.membershipRole ? formatRoleLabel(space.membershipRole) : "No access"}
            </p>
          </div>
          <div className="rounded-[2rem] border border-[#dbe4f0] bg-white px-5 py-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
            <p className="text-xs uppercase tracking-[0.18em] text-[#8aa0be]">Active workorders</p>
            <p className="mt-3 text-xl font-semibold text-foreground">{workOrders.length}</p>
          </div>
          <div className="rounded-[2rem] border border-[#dbe4f0] bg-white px-5 py-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
            <p className="text-xs uppercase tracking-[0.18em] text-[#8aa0be]">Unfinished</p>
            <p className="mt-3 text-xl font-semibold text-foreground">{unfinishedWorkOrderCount}</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-[#dbe4f0] bg-white shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
          <SpaceProfileForm space={space} />
        </div>
      </section>
    </MainShell>
  );
}
