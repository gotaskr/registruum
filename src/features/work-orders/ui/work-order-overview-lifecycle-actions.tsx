"use client";

import { usePathname } from "next/navigation";
import type { ArchiveFolderOption } from "@/features/archive/types/archive";
import type { WorkOrderPermissionSet } from "@/features/permissions/lib/work-order-permissions";
import { WorkOrderSidebarArchiveAction } from "@/features/work-orders/ui/work-order-sidebar-archive-action";
import { WorkOrderSidebarCompleteAction } from "@/features/work-orders/ui/work-order-sidebar-complete-action";
import type { WorkOrder } from "@/types/work-order";

const touchPrimaryButtonClass =
  "h-10 w-full justify-center text-sm sm:h-8 sm:w-auto sm:text-xs";

type WorkOrderOverviewLifecycleActionsProps = Readonly<{
  workOrder: WorkOrder;
  permissions: WorkOrderPermissionSet;
  archiveFolders: ArchiveFolderOption[];
  defaultArchiveFolderId: string;
}>;

export function WorkOrderOverviewLifecycleActions({
  workOrder,
  permissions,
  archiveFolders,
  defaultArchiveFolderId,
}: WorkOrderOverviewLifecycleActionsProps) {
  const pathname = usePathname();
  const archiveReady =
    archiveFolders.length > 0 && Boolean(defaultArchiveFolderId);

  const showComplete =
    permissions.canChangeLifecycleStatus &&
    !permissions.isCompleted &&
    !permissions.isArchived;

  const showArchive =
    permissions.canArchiveWorkOrder &&
    permissions.isCompleted &&
    !permissions.isArchived &&
    archiveReady;

  if (!showComplete && !showArchive) {
    return null;
  }

  return (
    <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap">
      {showComplete ? (
        <WorkOrderSidebarCompleteAction
          workOrderId={workOrder.id}
          spaceId={workOrder.spaceId}
          workOrderTitle={workOrder.title}
          returnTo={pathname}
          buttonClassName={touchPrimaryButtonClass}
        />
      ) : null}
      {showArchive ? (
        <WorkOrderSidebarArchiveAction
          workOrderId={workOrder.id}
          spaceId={workOrder.spaceId}
          workOrderTitle={workOrder.title}
          defaultArchiveFolderId={defaultArchiveFolderId}
          folders={archiveFolders}
          buttonClassName={touchPrimaryButtonClass}
        />
      ) : null}
    </div>
  );
}
