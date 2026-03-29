import type { ReactNode } from "react";
import { GlobalRail } from "@/components/layout/global-rail";
import { WorkOrderSidebar } from "@/components/layout/work-order-sidebar";
import type { Profile } from "@/types/profile";
import type { Space } from "@/types/space";
import type { WorkOrder } from "@/types/work-order";

type AppShellProps = Readonly<{
  spaces: Space[];
  profile: Profile;
  space: Space;
  workOrders: WorkOrder[];
  children: ReactNode;
}>;

export function AppShell({
  spaces,
  profile,
  space,
  workOrders,
  children,
}: AppShellProps) {
  return (
    <div className="h-full min-h-0 overflow-hidden bg-background text-foreground">
      <div className="grid h-full min-h-0 grid-cols-1 bg-panel lg:grid-cols-[4.75rem_21.5rem_minmax(0,1fr)]">
        <GlobalRail
          activeView="spaces"
          currentSpaceId={space.id}
          spaces={spaces}
          profile={profile}
        />
        <WorkOrderSidebar space={space} workOrders={workOrders} profile={profile} />
        <div className="min-h-0 min-w-0 overflow-hidden border-t border-border bg-panel lg:border-t-0 lg:border-l">
          {children}
        </div>
      </div>
    </div>
  );
}
