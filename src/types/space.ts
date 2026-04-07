import type { SpaceMembershipRole } from "@/types/database";

export type SpaceType =
  | "buildings"
  | "small-business"
  | "facility"
  | "factory";

export type Space = Readonly<{
  id: string;
  name: string;
  address: string | null;
  spaceType: SpaceType | null;
  photoPath: string | null;
  photoFileName: string | null;
  photoUrl: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  membershipRole?: SpaceMembershipRole;
  canAccessOverview: boolean;
  landingWorkOrderId: string | null;
}>;
