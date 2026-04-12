import "server-only";

import { getCurrentProfile } from "@/features/auth/api/profiles";
import { getArchivePageData } from "@/features/archive/api/archive";
import { canCreateWorkOrder } from "@/features/permissions/lib/work-order-permissions";
import { getRecentActivityForSpace, getSpaceByIdForUser, getSpacesForUser } from "@/features/spaces/api/spaces";
import type {
  MobileAccountData,
  MobileHomeData,
  MobileSpaceHubData,
  MobileSpaceListData,
  MobileWorkOrderCard,
} from "@/features/mobile/types/mobile";
import { getWorkOrdersForSpace } from "@/features/work-orders/api/work-orders";
import { formatDateLabel, formatDateTimeLabel, formatWorkOrderLocation } from "@/lib/utils";
import type { LogEntry } from "@/types/log";
import type { WorkOrder } from "@/types/work-order";

function isActiveStatus(status: WorkOrder["status"]) {
  return status === "in_progress" || status === "on_hold";
}

function buildWorkOrderCard(workOrder: WorkOrder, spaceName: string): MobileWorkOrderCard {
  return {
    id: workOrder.id,
    title: workOrder.title,
    spaceId: workOrder.spaceId,
    spaceName,
    locationLabel: formatWorkOrderLocation(workOrder.locationLabel, workOrder.unitLabel),
    status: workOrder.status,
    dueLabel: formatDateLabel(workOrder.dueDate ?? workOrder.expirationAt),
    activityHint: `Updated ${formatDateTimeLabel(workOrder.updatedAt)}`,
  };
}

export async function getMobileHomeData(): Promise<MobileHomeData> {
  const [profile, spaces] = await Promise.all([
    getCurrentProfile(),
    getSpacesForUser(),
  ]);

  const spaceEntries = await Promise.all(
    spaces.map(async (space) => ({
      space,
      workOrders: await getWorkOrdersForSpace(space.id),
      recentActivity: space.canAccessOverview
        ? await getRecentActivityForSpace(space.id, 4)
        : ([] as LogEntry[]),
    })),
  );

  const workOrderCards = spaceEntries.flatMap(({ space, workOrders }) =>
    workOrders.map((workOrder) => buildWorkOrderCard(workOrder, space.name)),
  );
  const activeWorkOrders = workOrderCards
    .filter((card) =>
      isActiveStatus(
        spaceEntries
          .flatMap((entry) => entry.workOrders)
          .find((workOrder) => workOrder.id === card.id)?.status ?? "open",
      ),
    )
    .slice(0, 6);
  const dueSoonWorkOrders = [...spaceEntries.flatMap((entry) => entry.workOrders)]
    .filter((workOrder) => workOrder.status !== "completed" && workOrder.status !== "archived")
    .sort((left, right) => {
      const leftDate = left.dueDate ?? left.expirationAt ?? "";
      const rightDate = right.dueDate ?? right.expirationAt ?? "";

      if (!leftDate && !rightDate) {
        return right.updatedAt.localeCompare(left.updatedAt);
      }

      if (!leftDate) {
        return 1;
      }

      if (!rightDate) {
        return -1;
      }

      return leftDate.localeCompare(rightDate);
    })
    .slice(0, 6)
    .map((workOrder) => {
      const spaceName =
        spaceEntries.find((entry) => entry.space.id === workOrder.spaceId)?.space.name ??
        "Unknown Space";

      return buildWorkOrderCard(workOrder, spaceName);
    });
  const recentActivity = spaceEntries
    .flatMap(({ space, recentActivity: entries }) =>
      entries.map((entry) => ({
        ...entry,
        spaceId: space.id,
        spaceName: space.name,
      })),
    )
    .sort((left, right) => (right.rawCreatedAt ?? "").localeCompare(left.rawCreatedAt ?? ""))
    .slice(0, 10);

  return {
    profile: {
      id: profile.id,
      fullName: profile.fullName,
      avatarUrl: profile.avatarUrl,
      email: profile.email,
    },
    spaces,
    createSpaceId: spaces.find((space) => canCreateWorkOrder(space.membershipRole ?? null))?.id ?? null,
    activeWorkOrders,
    dueSoonWorkOrders,
    recentActivity,
  };
}

export async function getMobileSpacesData(): Promise<MobileSpaceListData> {
  const [profile, spaces] = await Promise.all([
    getCurrentProfile(),
    getSpacesForUser(),
  ]);

  const items = await Promise.all(
    spaces.map(async (space) => {
      const [workOrders, recentActivity] = await Promise.all([
        getWorkOrdersForSpace(space.id),
        space.canAccessOverview ? getRecentActivityForSpace(space.id, 1) : Promise.resolve([]),
      ]);

      return {
        id: space.id,
        name: space.name,
        membershipRole: space.membershipRole,
        workOrderCount: workOrders.filter(
          (workOrder) =>
            workOrder.status !== "completed" && workOrder.status !== "archived",
        ).length,
        latestActivityLabel:
          recentActivity[0]?.createdAt ??
          (workOrders[0] ? `Updated ${formatDateTimeLabel(workOrders[0].updatedAt)}` : "No recent activity"),
      };
    }),
  );

  return {
    profile: {
      id: profile.id,
      fullName: profile.fullName,
    },
    spaces,
    items,
  };
}

export async function getMobileSpaceHubData(spaceId: string): Promise<MobileSpaceHubData> {
  const space = await getSpaceByIdForUser(spaceId);
  const [workOrders, recentActivity] = await Promise.all([
    getWorkOrdersForSpace(spaceId),
    space.canAccessOverview ? getRecentActivityForSpace(spaceId, 6) : Promise.resolve([]),
  ]);

  return {
    space,
    workOrders,
    recentActivity,
  };
}

export async function getMobileArchiveData(input: Readonly<{
  folderId?: string | null;
  spaceId?: string | null;
  query?: string | null;
  sort?: string | null;
}>) {
  const data = await getArchivePageData(input);

  return {
    folders: data.folderOptions,
    selectedFolderId: data.selectedFolderId,
    selectedSpaceId: data.selectedSpaceId,
    items: data.items,
    totalCount: data.totalCount,
    searchQuery: data.searchQuery,
    sort: data.sort,
  };
}

export async function getMobileAccountData(): Promise<MobileAccountData> {
  const profile = await getCurrentProfile();

  return {
    profile: {
      id: profile.id,
      fullName: profile.fullName,
      email: profile.email,
      avatarUrl: profile.avatarUrl,
      userTag: profile.userTag,
      representsCompany: profile.representsCompany,
      companyName: profile.companyName,
      companyEmail: profile.companyEmail,
      emailVerifiedAt: profile.emailVerifiedAt,
    },
  };
}
