import type { SpaceMembershipRole } from "@/types/database";

export type Space = Readonly<{
  id: string;
  name: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  membershipRole?: SpaceMembershipRole;
  canAccessOverview: boolean;
  landingWorkOrderId: string | null;
}>;
