"use client";

import {
  Archive,
  ArrowLeft,
  BriefcaseBusiness,
  MapPin,
  Settings,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { WORK_ORDER_CONTEXT_NAV } from "@/components/layout/context-nav-config";
import { SidebarItem } from "@/components/ui/sidebar-item";
import type { ArchiveFolderOption } from "@/features/archive/types/archive";
import { getWorkOrderPermissionSet } from "@/features/permissions/lib/work-order-permissions";
import {
  canAccessSpaceArchive,
  canAccessSpaceSettings,
  canAccessSpaceTeam,
} from "@/features/permissions/lib/roles";
import { getSpaceTypeLabel } from "@/features/spaces/lib/space-types";
import { SpaceAvatar } from "@/features/spaces/ui/space-avatar";
import { WorkOrderSidebarArchiveAction } from "@/features/work-orders/ui/work-order-sidebar-archive-action";
import { WorkOrderSidebarCompleteAction } from "@/features/work-orders/ui/work-order-sidebar-complete-action";
import {
  getRouteContext,
  getSpaceArchiveHref,
  getSpaceSettingsHref,
  getSpaceTeamHref,
  getSpaceWorkOrdersHref,
  getWorkOrderModuleHref,
} from "@/lib/route-utils";
import { formatWorkOrderLocation } from "@/lib/utils";
import type { Space } from "@/types/space";
import type { WorkOrder } from "@/types/work-order";

type ContextSidebarProps = Readonly<{
  space: Space;
  workOrders: WorkOrder[];
  archiveFolders: ArchiveFolderOption[];
  defaultArchiveFolderId: string;
}>;

export function ContextSidebar({
  space,
  workOrders,
  archiveFolders,
  defaultArchiveFolderId,
}: ContextSidebarProps) {
  const pathname = usePathname();
  const route = getRouteContext(pathname);
  const currentWorkOrder = useMemo(
    () => workOrders.find((workOrder) => workOrder.id === route.workOrderId) ?? null,
    [route.workOrderId, workOrders],
  );

  if (currentWorkOrder) {
    const permissions = getWorkOrderPermissionSet({
      role: currentWorkOrder.actorRole,
      status: currentWorkOrder.status,
      isOwner: false,
      documentRules: {
        allowDocumentDeletionInProgress:
          currentWorkOrder.allowDocumentDeletionInProgress,
        lockDocumentsOnCompleted: currentWorkOrder.lockDocumentsOnCompleted,
      },
    });

    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="rounded-[2rem] border border-border bg-panel p-5 shadow-[0_16px_34px_rgba(15,23,42,0.05)] dark:shadow-none">
          <Link
            href={getSpaceWorkOrdersHref(space.id)}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
            data-workorder-tour="workorder-nav-back"
          >
            <ArrowLeft className="h-4 w-4" />
            All workorders
          </Link>
          <div
            className="mt-5 rounded-[1.5rem] border border-border bg-panel-muted px-4 py-4"
            data-workorder-tour="workorder-project-card"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
              Project
            </p>
            <h2 className="mt-3 text-xl font-semibold text-foreground">
              {currentWorkOrder.title}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {formatWorkOrderLocation(
                currentWorkOrder.locationLabel,
                currentWorkOrder.unitLabel,
              )}
            </p>
          </div>

          {(permissions.canChangeLifecycleStatus &&
            !permissions.isCompleted &&
            !permissions.isArchived) ||
          (permissions.canArchiveWorkOrder &&
            permissions.isCompleted &&
            !permissions.isArchived &&
            archiveFolders.length > 0 &&
            defaultArchiveFolderId) ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {permissions.canChangeLifecycleStatus &&
              !permissions.isCompleted &&
              !permissions.isArchived ? (
                <WorkOrderSidebarCompleteAction
                  workOrderId={currentWorkOrder.id}
                  spaceId={space.id}
                  workOrderTitle={currentWorkOrder.title}
                  returnTo={pathname}
                />
              ) : null}
              {permissions.canArchiveWorkOrder &&
              permissions.isCompleted &&
              !permissions.isArchived &&
              archiveFolders.length > 0 &&
              defaultArchiveFolderId ? (
                <WorkOrderSidebarArchiveAction
                  workOrderId={currentWorkOrder.id}
                  spaceId={space.id}
                  workOrderTitle={currentWorkOrder.title}
                  defaultArchiveFolderId={defaultArchiveFolderId}
                  folders={archiveFolders}
                />
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex-1 rounded-[2rem] border border-border bg-panel p-3 shadow-[0_16px_34px_rgba(15,23,42,0.05)] dark:shadow-none">
          <div className="px-2 pb-2 pt-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
              Project Navigation
            </p>
          </div>
          <div className="space-y-2">
          {WORK_ORDER_CONTEXT_NAV.map((item) => (
            <span
              key={item.slug}
              className="block"
              data-workorder-tour={`workorder-module-${item.slug}`}
            >
              <SidebarItem
                label={item.label}
                href={getWorkOrderModuleHref(space.id, currentWorkOrder.id, item.slug)}
                icon={item.icon}
                isActive={route.workOrderId === currentWorkOrder.id && route.module === item.slug}
                className="w-full text-[15px]"
              />
            </span>
          ))}
          </div>
        </div>
      </div>
    );
  }

  const isTeamRoute = pathname === getSpaceTeamHref(space.id);
  const isArchiveRoute = pathname === getSpaceArchiveHref(space.id);
  const isSettingsRoute = pathname === getSpaceSettingsHref(space.id);
  const isWorkOrdersRoute =
    pathname === getSpaceWorkOrdersHref(space.id) ||
    (!isTeamRoute && !isArchiveRoute && !isSettingsRoute);
  const canShowTeam = canAccessSpaceTeam(space.membershipRole);
  const canShowArchive = canAccessSpaceArchive(space.membershipRole);
  const canShowSettings = canAccessSpaceSettings(space.membershipRole);

  return (
    <>
      <div className="flex h-full min-h-0 flex-col">
        <div
          className="rounded-[2rem] border border-border bg-panel p-5 shadow-[0_16px_34px_rgba(15,23,42,0.05)] dark:shadow-none"
          data-space-tour="space-profile"
        >
          <div className="flex flex-col items-center text-center">
            <SpaceAvatar
              name={space.name}
              photoUrl={space.photoUrl}
              className="h-20 w-20 rounded-[1.6rem]"
              fallbackClassName="border border-border"
            />
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
              Organization
            </p>
            <h2 className="mt-3 break-words text-[1.85rem] font-semibold leading-tight text-foreground">
              {space.name}
            </h2>
            {space.spaceType ? (
              <span className="mt-4 inline-flex rounded-full border border-border bg-panel-muted px-3 py-1 text-xs font-semibold text-muted">
                {getSpaceTypeLabel(space.spaceType)}
              </span>
            ) : null}
            {space.address ? (
              <div className="mt-3 flex items-start justify-center gap-2 rounded-[1.2rem] border border-border bg-panel-muted px-3 py-2 text-sm text-muted">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span className="break-words leading-5">{space.address}</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex-1 rounded-[2rem] border border-border bg-panel p-3 shadow-[0_16px_34px_rgba(15,23,42,0.05)] dark:shadow-none">
          <div className="px-2 pb-2 pt-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
              Space Navigation
            </p>
          </div>
          <div className="space-y-2">
            <span className="block" data-space-tour="space-nav-workorders">
              <SidebarItem
                label="Workorders"
                href={getSpaceWorkOrdersHref(space.id)}
                icon={BriefcaseBusiness}
                isActive={isWorkOrdersRoute}
                className="w-full text-[15px]"
              />
            </span>
            {canShowTeam ? (
              <span className="block" data-space-tour="space-nav-team">
                <SidebarItem
                  label="Team"
                  href={getSpaceTeamHref(space.id)}
                  icon={UsersRound}
                  isActive={isTeamRoute}
                  className="w-full text-[15px]"
                />
              </span>
            ) : null}
            {canShowArchive ? (
              <span className="block" data-space-tour="space-nav-archive">
                <SidebarItem
                  label="Archive"
                  href={getSpaceArchiveHref(space.id)}
                  icon={Archive}
                  isActive={isArchiveRoute}
                  className="w-full text-[15px]"
                />
              </span>
            ) : null}
            {canShowSettings ? (
              <span className="block" data-space-tour="space-nav-settings">
                <SidebarItem
                  label="Space Settings"
                  href={getSpaceSettingsHref(space.id)}
                  icon={Settings}
                  isActive={isSettingsRoute}
                  className="w-full text-[15px]"
                />
              </span>
            ) : null}
          </div>
        </div>
      </div>

    </>
  );
}
