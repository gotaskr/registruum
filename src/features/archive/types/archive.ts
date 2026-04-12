export type ArchiveFolder = Readonly<{
  id: string;
  name: string;
  parentId: string | null;
  isSystemDefault: boolean;
  depth: number;
  pathLabel: string;
  archivedCount: number;
  createdAt: string;
  updatedAt: string;
}>;

export type ArchiveFolderOption = Readonly<{
  id: string;
  name: string;
  parentId: string | null;
  isSystemDefault: boolean;
  depth: number;
  pathLabel: string;
}>;

export type ArchiveSpaceFilterOption = Readonly<{
  id: string;
  name: string;
}>;

export type ArchivedWorkOrderDetails = Readonly<{
  archivedWorkOrderId: string;
  spaceId: string;
  folderId: string;
  folderName: string;
  archivedAtLabel: string;
  archivedByName: string;
  spaceName: string;
  workOrder: import("@/types/work-order").WorkOrder;
  overview: import("@/features/work-orders/types/work-order-overview").WorkOrderOverviewData;
  documentFolders: import("@/features/documents/types/document-browser").WorkOrderDocumentFolder[];
  documents: import("@/features/documents/types/document-browser").WorkOrderDocumentRecord[];
  messages: import("@/types/message").Message[];
  members: import("@/features/members/types/work-order-member").WorkOrderMember[];
  logs: import("@/types/log").LogEntry[];
}>;

export type ArchivedWorkOrderItem = Readonly<{
  id: string;
  originalWorkOrderId: string;
  title: string;
  spaceId: string;
  spaceName: string;
  folderId: string;
  folderName: string;
  archivedByUserId: string | null;
  archivedByName: string;
  archivedAt: string;
  archivedAtLabel: string;
  viewHref: string;
}>;

export type ArchiveSortOption = "archived_desc" | "archived_asc" | "title_asc" | "title_desc";

export type ArchivePageData = Readonly<{
  folders: ArchiveFolder[];
  folderOptions: ArchiveFolderOption[];
  spaceOptions: ArchiveSpaceFilterOption[];
  selectedFolderId: string | null;
  selectedSpaceId: string | null;
  defaultFolderId: string;
  searchQuery: string;
  sort: ArchiveSortOption;
  items: ArchivedWorkOrderItem[];
  totalCount: number;
}>;

export type ArchiveActionState = Readonly<{
  error?: string;
  success?: string;
}>;

export const initialArchiveActionState: ArchiveActionState = {};
