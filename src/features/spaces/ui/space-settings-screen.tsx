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

  const section = (
      <section className="space-y-4 px-4 py-5 sm:space-y-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="rounded-2xl border border-border bg-panel p-4 shadow-sm sm:rounded-[2rem] sm:p-6 sm:shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
          <div className="flex items-start gap-3 sm:gap-4">
            <SpaceAvatar
              name={space.name}
              photoUrl={space.photoUrl}
              className="h-16 w-16 rounded-xl sm:h-20 sm:w-20 sm:rounded-[1.75rem]"
              fallbackClassName="border border-border"
            />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted sm:text-[11px] sm:tracking-[0.24em]">
                Space profile
              </p>
              <h2 className="mt-1.5 truncate text-xl font-semibold text-foreground sm:mt-2 sm:text-2xl">
                {space.name}
              </h2>
              <div className="mt-2 flex flex-wrap gap-1.5 sm:mt-3 sm:gap-2">
                {space.spaceType ? (
                  <span className="inline-flex rounded-full border border-border bg-panel-muted px-2.5 py-0.5 text-[11px] font-semibold text-foreground sm:px-3 sm:py-1 sm:text-xs">
                    {getSpaceTypeLabel(space.spaceType)}
                  </span>
                ) : null}
                {space.address ? (
                  <span className="inline-flex max-w-full rounded-full border border-border bg-accent-soft px-2.5 py-0.5 text-[11px] font-semibold text-accent sm:px-3 sm:py-1 sm:text-xs">
                    <span className="truncate">{space.address}</span>
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4">
          <div className="col-span-2 rounded-xl border border-border bg-panel px-3 py-3 shadow-sm sm:col-span-1 sm:rounded-[2rem] sm:px-5 sm:py-5 sm:shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted sm:text-xs sm:tracking-[0.18em]">
              Role
            </p>
            <p className="mt-1.5 truncate text-base font-semibold text-foreground sm:mt-3 sm:text-xl">
              {space.membershipRole ? formatRoleLabel(space.membershipRole) : "No access"}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-panel px-3 py-3 shadow-sm sm:rounded-[2rem] sm:px-5 sm:py-5 sm:shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted sm:text-xs sm:tracking-[0.18em]">
              Work orders
            </p>
            <p className="mt-1.5 text-base font-semibold tabular-nums text-foreground sm:mt-3 sm:text-xl">
              {workOrders.length}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-panel px-3 py-3 shadow-sm sm:rounded-[2rem] sm:px-5 sm:py-5 sm:shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted sm:text-xs sm:tracking-[0.18em]">
              Unfinished
            </p>
            <p className="mt-1.5 text-base font-semibold tabular-nums text-foreground sm:mt-3 sm:text-xl">
              {unfinishedWorkOrderCount}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-panel shadow-sm sm:rounded-[2rem] sm:shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
          <SpaceProfileForm space={space} />
        </div>
      </section>
  );

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
      {section}
    </MainShell>
  );
}
