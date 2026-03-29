import type { SpaceMembershipRole, WorkOrderStatus } from "@/types/database";

export type { WorkOrderStatus } from "@/types/database";
export type WorkOrderSubjectType =
  | "issue"
  | "maintenance"
  | "inspection"
  | "project"
  | "emergency";
export type WorkOrderPriority = "low" | "medium" | "high" | "urgent";

export type WorkOrderModule =
  | "overview"
  | "chat"
  | "documents"
  | "members"
  | "logs"
  | "settings";

export type WorkOrder = Readonly<{
  id: string;
  spaceId: string;
  createdByUserId: string;
  title: string;
  subjectType: WorkOrderSubjectType;
  subject: string | null;
  locationLabel: string | null;
  unitLabel: string | null;
  description: string | null;
  priority: WorkOrderPriority;
  startDate: string | null;
  dueDate: string | null;
  expirationAt: string | null;
  ownerUserId: string;
  vendorName: string | null;
  autoSaveChatAttachments: boolean;
  allowDocumentDeletionInProgress: boolean;
  lockDocumentsOnCompleted: boolean;
  status: WorkOrderStatus;
  actorRole: SpaceMembershipRole | null;
  isPostedToJobMarket: boolean;
  createdAt: string;
  updatedAt: string;
}>;
