import type { UpgradePrompt } from "@/features/settings/types/upgrade-prompt";

export type ChatActionState = Readonly<{
  error?: string;
  upgradePrompt?: UpgradePrompt;
}>;

export const initialChatActionState: ChatActionState = {};
