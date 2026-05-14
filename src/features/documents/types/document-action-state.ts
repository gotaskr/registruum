import type { UpgradePrompt } from "@/features/settings/types/upgrade-prompt";

export type DocumentActionState = Readonly<{
  error?: string;
  upgradePrompt?: UpgradePrompt;
}>;

export const initialDocumentActionState: DocumentActionState = {};
