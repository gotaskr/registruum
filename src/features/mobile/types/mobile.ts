import type { ArchiveFolderOption, ArchivedWorkOrderItem } from "@/features/archive/types/archive";
import type { WorkOrderDocumentFolder, WorkOrderDocumentRecord } from "@/features/documents/types/document-browser";
import type { WorkOrderMember } from "@/features/members/types/work-order-member";
import type { WorkOrderOverviewData } from "@/features/work-orders/types/work-order-overview";
import type { LogEntry } from "@/types/log";
import type { Message } from "@/types/message";
import type { Profile } from "@/types/profile";
import type { Space } from "@/types/space";
import type { WorkOrder } from "@/types/work-order";

export type MobileWorkOrderCard = Readonly<{
  id: string;
  title: string;
  spaceId: string;
  spaceName: string;
  locationLabel: string;
  status: WorkOrder["status"];
  dueLabel: string;
  activityHint: string;
}>;

export type MobileHomeData = Readonly<{
  profile: Pick<Profile, "id" | "fullName" | "avatarUrl" | "email">;
  spaces: Space[];
  createSpaceId: string | null;
  activeWorkOrders: MobileWorkOrderCard[];
  dueSoonWorkOrders: MobileWorkOrderCard[];
  recentActivity: (LogEntry & { spaceId: string; spaceName: string })[];
}>;

export type MobileSpaceListItem = Readonly<{
  id: string;
  name: string;
  membershipRole: Space["membershipRole"];
  workOrderCount: number;
  latestActivityLabel: string;
}>;

export type MobileSpaceListData = Readonly<{
  profile: Pick<Profile, "id" | "fullName">;
  spaces: Space[];
  items: MobileSpaceListItem[];
}>;

export type MobileSpaceHubData = Readonly<{
  space: Space;
  workOrders: WorkOrder[];
  recentActivity: LogEntry[];
}>;

export type MobileArchiveData = Readonly<{
  folders: ArchiveFolderOption[];
  selectedFolderId: string | null;
  selectedSpaceId: string | null;
  items: ArchivedWorkOrderItem[];
  totalCount: number;
  searchQuery: string;
  sort: "archived_desc" | "archived_asc" | "title_asc" | "title_desc";
}>;

export type MobileAccountData = Readonly<{
  profile: Pick<
    Profile,
    | "id"
    | "fullName"
    | "email"
    | "avatarUrl"
    | "userTag"
    | "representsCompany"
    | "companyName"
    | "companyEmail"
    | "emailVerifiedAt"
  >;
}>;

export type MobileArchivedMeta = Readonly<{
  archivedWorkOrderId: string;
  archivedAtLabel: string;
  archivedByName: string;
  folderName: string;
}>;

export type MobileWorkOrderDetailsData = Readonly<{
  space: Pick<Space, "id" | "name">;
  workOrder: WorkOrder;
  actorUserId: string;
  actorName: string;
  overview: WorkOrderOverviewData;
  members: WorkOrderMember[];
  documentFolders: WorkOrderDocumentFolder[];
  documents: WorkOrderDocumentRecord[];
  messages: Message[];
  logs: LogEntry[];
  canSendMessage: boolean;
  canUploadDocuments: boolean;
  canDeleteDocuments: boolean;
  canComplete: boolean;
  lockedMessage?: string;
  archivedMeta?: MobileArchivedMeta;
}>;
