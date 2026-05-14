import type { UpgradePrompt } from "@/features/settings/types/upgrade-prompt";

export type SpaceActionState = Readonly<{
  error?: string;
  upgradePrompt?: UpgradePrompt;
  fieldErrors?: Readonly<{
    name?: string;
    spaceType?: string;
    address?: string;
    photo?: string;
  }>;
}>;

export const initialSpaceActionState: SpaceActionState = {};
