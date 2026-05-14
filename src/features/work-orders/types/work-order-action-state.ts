import type { UpgradePrompt } from "@/features/settings/types/upgrade-prompt";

export type WorkOrderActionState = Readonly<{
  error?: string;
  success?: string;
  upgradePrompt?: UpgradePrompt;
}>;

export const initialWorkOrderActionState: WorkOrderActionState = {};
