"use client";

import {
  LayoutDashboard,
  FileText,
  Logs,
  MessageSquareText,
  Settings,
  UsersRound,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AccordionItem } from "@/components/ui/accordion-item";
import { SidebarItem } from "@/components/ui/sidebar-item";
import type { ArchiveFolderOption } from "@/features/archive/types/archive";
import { WORK_ORDER_MODULES } from "@/lib/constants";
import {
  canAccessWorkOrderModule,
  canCreateWorkOrder,
  getWorkOrderPermissionSet,
} from "@/features/permissions/lib/work-order-permissions";
import { CreateWorkOrderModal } from "@/features/work-orders/ui/create-work-order-modal";
import { WorkOrderSidebarArchiveAction } from "@/features/work-orders/ui/work-order-sidebar-archive-action";
import { WorkOrderSidebarActions } from "@/features/work-orders/ui/work-order-sidebar-actions";
import { WorkOrderSidebarCompleteAction } from "@/features/work-orders/ui/work-order-sidebar-complete-action";
import { getRouteContext, getWorkOrderModuleHref } from "@/lib/route-utils";
import { formatWorkOrderLocation } from "@/lib/utils";
import type { Profile } from "@/types/profile";
import type { Space } from "@/types/space";
import type { WorkOrder, WorkOrderModule } from "@/types/work-order";

const moduleIconMap: Record<WorkOrderModule, typeof MessageSquareText> = {
  overview: LayoutDashboard,
  chat: MessageSquareText,
  documents: FileText,
  members: UsersRound,
  logs: Logs,
  settings: Settings,
};

type WorkOrderSidebarProps = Readonly<{
  space: Space;
  workOrders: WorkOrder[];
  archiveFolders: ArchiveFolderOption[];
  defaultArchiveFolderId: string;
  profile?: Profile;
}>;

type SidebarTreeProps = Readonly<{
  space: Space;
  workOrders: WorkOrder[];
  archiveFolders: ArchiveFolderOption[];
  defaultArchiveFolderId: string;
  activeWorkOrderId?: string;
  activeModule?: WorkOrderModule;
  initialOpenWorkOrderId: string | null;
  pathname: string;
}>;

function SidebarTree({
  space,
  workOrders,
  archiveFolders,
  defaultArchiveFolderId,
  activeWorkOrderId,
  activeModule,
  initialOpenWorkOrderId,
  pathname,
}: SidebarTreeProps) {
  const [openWorkOrderId, setOpenWorkOrderId] = useState<string | null>(
    initialOpenWorkOrderId,
  );

  return (
    <div className="min-h-0 overflow-hidden">
      {workOrders.map((workOrder) => (
        (() => {
          const permissions = getWorkOrderPermissionSet({
            role: workOrder.actorRole,
            status: workOrder.status,
          });

          return (
            <AccordionItem
              key={workOrder.id}
              href={getWorkOrderModuleHref(space.id, workOrder.id, "overview")}
              title={workOrder.title}
              subtitle={formatWorkOrderLocation(
                workOrder.locationLabel,
                workOrder.unitLabel,
              )}
              titleAccessory={
                permissions.canChangeLifecycleStatus && !permissions.isCompleted && !permissions.isArchived ? (
                  <WorkOrderSidebarCompleteAction
                    workOrderId={workOrder.id}
                    spaceId={space.id}
                    workOrderTitle={workOrder.title}
                    returnTo={pathname}
                  />
                ) : permissions.canArchiveWorkOrder &&
                  permissions.isCompleted &&
                  defaultArchiveFolderId &&
                  archiveFolders.length > 0 ? (
                  <WorkOrderSidebarArchiveAction
                    workOrderId={workOrder.id}
                    spaceId={space.id}
                    workOrderTitle={workOrder.title}
                    defaultArchiveFolderId={defaultArchiveFolderId}
                    folders={archiveFolders}
                  />
                ) : undefined
              }
              actions={
                workOrder.actorRole ? (
                  <WorkOrderSidebarActions
                    workOrder={workOrder}
                    actorRole={workOrder.actorRole}
                    returnTo={pathname}
                  />
                ) : undefined
              }
              isOpen={openWorkOrderId === workOrder.id}
              isActive={activeWorkOrderId === workOrder.id}
              onToggle={() =>
                setOpenWorkOrderId((current) =>
                  current === workOrder.id ? null : workOrder.id,
                )
              }
            >
              <div className="space-y-1 border-l border-[#d9e2ef] pl-3">
                {WORK_ORDER_MODULES.filter(
                  (module) =>
                    module.slug !== "settings" &&
                    canAccessWorkOrderModule(module.slug, permissions),
                ).map((module) => (
                  <SidebarItem
                    key={module.slug}
                    label={module.label}
                    href={getWorkOrderModuleHref(space.id, workOrder.id, module.slug)}
                    icon={moduleIconMap[module.slug]}
                    isActive={
                      activeWorkOrderId === workOrder.id && activeModule === module.slug
                    }
                    className="w-full rounded-lg py-2 text-[15px]"
                  />
                ))}
              </div>
            </AccordionItem>
          );
        })()
      ))}
    </div>
  );
}

export function WorkOrderSidebar({
  space,
  workOrders,
  archiveFolders,
  defaultArchiveFolderId,
  profile,
}: WorkOrderSidebarProps) {
  const pathname = usePathname();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const route = getRouteContext(pathname);
  const initialOpenWorkOrderId = route.workOrderId ?? workOrders[0]?.id ?? null;
  const canCreate = space.membershipRole
    ? canCreateWorkOrder(space.membershipRole)
    : false;
  const firstName =
    profile?.fullName.trim().split(/\s+/)[0] ?? null;

  return (
    <>
      <aside className="h-full min-h-0 border-b border-border bg-panel-muted lg:border-r lg:border-b-0">
        <div className="grid h-full min-h-0 grid-rows-[auto_1fr]">
          <div className="border-b border-border px-4 py-5">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-[15px] font-semibold text-foreground">{space.name}</h1>
              {firstName ? (
                <span className="inline-flex shrink-0 items-center rounded-full border border-border bg-panel px-2.5 py-1 text-[11px] font-medium text-muted">
                  {firstName}
                </span>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => {
                if (canCreate) {
                  setIsCreateModalOpen(true);
                }
              }}
              disabled={!canCreate}
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="text-lg leading-none">+</span>
              <span>Create Work Order</span>
            </button>
            {space.canAccessOverview ? (
              <div className="mt-5 space-y-1">
                <SidebarItem
                  label="Overview"
                  href={`/space/${space.id}`}
                  icon={LayoutDashboard}
                  isActive={pathname === `/space/${space.id}`}
                  className="w-full rounded-xl"
                />
              </div>
            ) : null}
          </div>
          <SidebarTree
            key={pathname}
            space={space}
            workOrders={workOrders}
            archiveFolders={archiveFolders}
            defaultArchiveFolderId={defaultArchiveFolderId}
            activeWorkOrderId={route.workOrderId}
            activeModule={route.module}
            initialOpenWorkOrderId={initialOpenWorkOrderId}
            pathname={pathname}
          />
        </div>
      </aside>
      <CreateWorkOrderModal
        open={isCreateModalOpen}
        spaceId={space.id}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
}
