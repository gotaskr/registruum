"use client";

import type { ReactNode } from "react";
import { ContextBottomNav } from "@/components/layout/context-bottom-nav";
import { ContextSidebar } from "@/components/layout/context-sidebar";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { SpaceFirstVisitTour } from "@/features/spaces/ui/space-first-visit-tour";
import { WorkOrderFirstVisitTour } from "@/features/work-orders/ui/work-order-first-visit-tour";
import type { ArchiveFolderOption } from "@/features/archive/types/archive";
import type { Profile } from "@/types/profile";
import type { Space } from "@/types/space";
import type { WorkOrder } from "@/types/work-order";

type AppShellProps = Readonly<{
  spaces: Space[];
  profile: Profile;
  space: Space;
  workOrders: WorkOrder[];
  archiveFolders: ArchiveFolderOption[];
  defaultArchiveFolderId: string;
  children: ReactNode;
}>;

export function AppShell({
  spaces,
  profile,
  space,
  workOrders,
  archiveFolders,
  defaultArchiveFolderId,
  children,
}: AppShellProps) {
  return (
    <WorkspaceShell
      profile={profile}
      spaces={spaces}
      space={space}
      sidebar={(
        <ContextSidebar
          space={space}
          workOrders={workOrders}
          archiveFolders={archiveFolders}
          defaultArchiveFolderId={defaultArchiveFolderId}
        />
      )}
      mobileBottomNav={(
        <ContextBottomNav
          space={space}
          workOrders={workOrders}
          archiveFolders={archiveFolders}
          defaultArchiveFolderId={defaultArchiveFolderId}
        />
      )}
    >
      <SpaceFirstVisitTour profileId={profile.id} space={space} />
      <WorkOrderFirstVisitTour profileId={profile.id} />
      {children}
    </WorkspaceShell>
  );
}
