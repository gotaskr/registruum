import type { SpaceMembershipRole } from "@/types/database";

export type SettingsInvitation = Readonly<{
  id: string;
  spaceName: string;
  role: SpaceMembershipRole;
  method: "email" | "link" | "code";
  invitedByName: string;
  createdAt: string;
  expiresAt: string;
  message: string | null;
  workOrderTitles: string[];
}>;
