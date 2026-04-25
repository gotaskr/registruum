import { DEFAULT_MODULE, isWorkOrderModule } from "@/lib/constants";
import type { Space } from "@/types/space";
import type { WorkOrderModule } from "@/types/work-order";

type RouteContext = Readonly<{
  spaceId?: string;
  workOrderId?: string;
  module?: WorkOrderModule;
}>;

export function getRouteContext(pathname: string): RouteContext {
  const segments = pathname.split("/").filter(Boolean);

  if (segments[0] !== "space") {
    return {};
  }

  const spaceId = segments[1];
  const workOrderId = segments[3];
  const moduleSegment = segments[4];

  return {
    spaceId,
    workOrderId,
    module: moduleSegment && isWorkOrderModule(moduleSegment) ? moduleSegment : undefined,
  };
}

export function getSpaceHref(spaceId: string) {
  return `/space/${spaceId}`;
}

export function getSpaceEntryHref(space: Pick<Space, "id">) {
  return getSpaceHref(space.id);
}

export function getSpaceWorkOrdersHref(spaceId: string) {
  return getSpaceHref(spaceId);
}

export function getSpaceTeamHref(spaceId: string) {
  return `/space/${spaceId}/team`;
}

export function getSpaceArchiveHref(spaceId: string) {
  return `/space/${spaceId}/archive`;
}

export function getSpaceSettingsHref(spaceId: string) {
  return `/space/${spaceId}/settings`;
}

export function getDashboardHref() {
  return "/";
}

export function getArchiveHref() {
  return "/archive";
}

export function getArchiveRecordHref(archivedWorkOrderId: string) {
  return `/archive/${archivedWorkOrderId}`;
}

export function getSettingsHref() {
  return "/settings";
}

export function getWorkOrderModuleHref(
  spaceId: string,
  workOrderId: string,
  module: WorkOrderModule = DEFAULT_MODULE,
) {
  return `/space/${spaceId}/work-order/${workOrderId}/${module}`;
}
