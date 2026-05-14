import type { UpgradePrompt } from "@/features/settings/types/upgrade-prompt";

export type InvitationActionState = Readonly<{
  error?: string;
  success?: string;
  inviteLink?: string;
  upgradePrompt?: UpgradePrompt;
}>;

export const initialInvitationActionState: InvitationActionState = {};
