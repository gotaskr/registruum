import type { SpaceMembershipRole } from "@/types/database";

export type WorkOrderMember = Readonly<{
  id: string;
  userId: string;
  workOrderId: string;
  name: string;
  email: string;
  userTag: string | null;
  role: SpaceMembershipRole;
  initials: string;
  avatarUrl: string | null;
  assignedAt: string;
}>;

export type WorkOrderPendingInvite = Readonly<{
  id: string;
  email: string | null;
  role: SpaceMembershipRole;
  createdAt: string;
  expiresAt: string;
  invitedByName: string | null;
  message: string | null;
}>;
