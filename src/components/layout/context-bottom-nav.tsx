"use client";

import {
  Archive,
  ArrowLeft,
  BriefcaseBusiness,
  Settings,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useLayoutEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  BOTTOM_NAV_ICON_BOX,
  BottomNavLabel,
  bottomNavItemClasses,
} from "@/components/layout/bottom-nav-shared";
import { BottomNavScrollArea } from "@/components/layout/bottom-nav-scroll-area";
import { WORK_ORDER_CONTEXT_NAV } from "@/components/layout/context-nav-config";
import type { ArchiveFolderOption } from "@/features/archive/types/archive";
import {
  canAccessSpaceArchive,
  canAccessSpaceSettings,
  canAccessSpaceTeam,
} from "@/features/permissions/lib/roles";
import {
  getRouteContext,
  getSpaceArchiveHref,
  getSpaceSettingsHref,
  getSpaceTeamHref,
  getSpaceWorkOrdersHref,
  getWorkOrderModuleHref,
} from "@/lib/route-utils";
import type { Space } from "@/types/space";
import type { WorkOrder } from "@/types/work-order";

type ContextBottomNavProps = Readonly<{
  space: Space;
  workOrders: WorkOrder[];
  archiveFolders: ArchiveFolderOption[];
  defaultArchiveFolderId: string;
}>;

export function ContextBottomNav({
  space,
  workOrders,
}: ContextBottomNavProps) {
  const pathname = usePathname();
  const route = getRouteContext(pathname);
  const activeModuleLinkRef = useRef<HTMLAnchorElement | null>(null);
  const currentWorkOrder = useMemo(
    () => workOrders.find((workOrder) => workOrder.id === route.workOrderId) ?? null,
    [route.workOrderId, workOrders],
  );

  useLayoutEffect(() => {
    if (!currentWorkOrder) return;
    activeModuleLinkRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [currentWorkOrder, route.module]);

  if (currentWorkOrder) {
    return (
      <BottomNavScrollArea
        aria-label="Work order navigation"
        innerClassName="min-h-[4rem] gap-1 px-2.5 py-2 sm:px-3"
      >
        <Link
          href={getSpaceWorkOrdersHref(space.id)}
          className={bottomNavItemClasses(false)}
          title="All workorders"
          data-workorder-tour="workorder-nav-back"
        >
          <span className={BOTTOM_NAV_ICON_BOX}>
            <ArrowLeft className="h-[1.15rem] w-[1.15rem] stroke-[2.5] text-current" aria-hidden />
          </span>
          <BottomNavLabel>Back</BottomNavLabel>
        </Link>
        <div className="mx-0.5 h-8 w-px shrink-0 bg-slate-200 dark:bg-white/15" aria-hidden />
        {WORK_ORDER_CONTEXT_NAV.map((item) => {
          const href = getWorkOrderModuleHref(space.id, currentWorkOrder.id, item.slug);
          const isActive =
            route.workOrderId === currentWorkOrder.id && route.module === item.slug;
          const Icon = item.icon;

          return (
            <Link
              key={item.slug}
              ref={isActive ? activeModuleLinkRef : undefined}
              href={href}
              className={bottomNavItemClasses(isActive)}
              title={item.label}
              data-workorder-tour={`workorder-module-${item.slug}`}
            >
              <span className={BOTTOM_NAV_ICON_BOX}>
                <Icon className="h-[1.15rem] w-[1.15rem] stroke-[2.35] text-current" aria-hidden />
              </span>
              <BottomNavLabel>{item.label}</BottomNavLabel>
            </Link>
          );
        })}
      </BottomNavScrollArea>
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

  const items: ReadonlyArray<{
    key: string;
    label: string;
    href: string;
    icon: typeof BriefcaseBusiness;
    isActive: boolean;
  }> = [
    {
      key: "workorders",
      label: "Workorders",
      href: getSpaceWorkOrdersHref(space.id),
      icon: BriefcaseBusiness,
      isActive: isWorkOrdersRoute,
    },
    ...(canShowTeam
      ? [
          {
            key: "team",
            label: "Team",
            href: getSpaceTeamHref(space.id),
            icon: UsersRound,
            isActive: isTeamRoute,
          },
        ]
      : []),
    ...(canShowArchive
      ? [
          {
            key: "archive",
            label: "Archive",
            href: getSpaceArchiveHref(space.id),
            icon: Archive,
            isActive: isArchiveRoute,
          },
        ]
      : []),
    ...(canShowSettings
      ? [
          {
            key: "settings",
            label: "Space",
            href: getSpaceSettingsHref(space.id),
            icon: Settings,
            isActive: isSettingsRoute,
          },
        ]
      : []),
  ];

  return (
    <nav
      className="flex min-h-[4rem] items-center justify-center gap-0.5 px-2 py-2 sm:gap-1 sm:px-3"
      aria-label="Space navigation"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const tourId =
          item.key === "workorders"
            ? "space-nav-workorders"
            : item.key === "team"
              ? "space-nav-team"
              : item.key === "archive"
                ? "space-nav-archive"
                : item.key === "settings"
                  ? "space-nav-settings"
                  : undefined;
        return (
          <Link
            key={item.key}
            href={item.href}
            className={bottomNavItemClasses(item.isActive, { equalWidth: true })}
            title={item.label}
            {...(tourId ? { "data-space-tour": tourId } : {})}
          >
            <span className={BOTTOM_NAV_ICON_BOX}>
              <Icon className="h-[1.15rem] w-[1.15rem] stroke-[2.35] text-current" aria-hidden />
            </span>
            <BottomNavLabel>{item.label}</BottomNavLabel>
          </Link>
        );
      })}
    </nav>
  );
}
