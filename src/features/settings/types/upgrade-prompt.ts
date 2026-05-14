export type UpgradePrompt = Readonly<{
  title: string;
  reason: string;
  suggestedAction: string;
}>;

/** Server-side plan gate with a structured prompt for the upgrade modal. */
export type PlanLimitBlock = Readonly<{
  message: string;
  upgradePrompt: UpgradePrompt;
}>;
