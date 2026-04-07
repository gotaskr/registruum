import type { SpaceMembershipRole } from "@/types/database";

export type Member = Readonly<{
  id: string;
  spaceId: string;
  userId: string;
  name: string;
  email: string;
  userTag: string | null;
  role: SpaceMembershipRole;
  initials: string;
  avatarUrl: string | null;
}>;
