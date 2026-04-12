import type { WorkOrderModule } from "@/types/work-order";

export type MobilePrimaryTab = "home" | "spaces" | "archive" | "account";
export type MobileWorkOrderTab = Extract<
  WorkOrderModule,
  "overview" | "chat" | "documents" | "logs"
>;

export function getMobileHomeHref() {
  return "/m";
}

export function getMobileSpacesHref() {
  return "/m/spaces";
}

export function getMobileArchiveHref() {
  return "/m/archive";
}

export function getMobileAccountHref() {
  return "/m/account";
}

export function getMobileSpaceHref(spaceId: string) {
  return `/m/space/${spaceId}`;
}

export function getMobileCreateWorkOrderHref(spaceId: string) {
  return `/m/space/${spaceId}/create`;
}

export function getMobileWorkOrderHref(
  spaceId: string,
  workOrderId: string,
  tab: MobileWorkOrderTab = "overview",
) {
  return `/m/space/${spaceId}/work-order/${workOrderId}/${tab}`;
}

export function getMobileArchiveRecordHref(
  archivedWorkOrderId: string,
  tab: MobileWorkOrderTab = "overview",
) {
  return `/m/archive/${archivedWorkOrderId}/${tab}`;
}
