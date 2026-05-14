"use client";

import { useEffect, useState } from "react";
import type { UpgradePrompt } from "@/features/settings/types/upgrade-prompt";

type StateWithUpgrade = Readonly<{
  error?: string;
  upgradePrompt?: UpgradePrompt;
}>;

type UsePlanLimitModalOptions = Readonly<{
  /** When this value changes on a blocked response, the modal can show again after a prior dismiss. */
  attemptKey?: unknown;
}>;

/**
 * Shows `UpgradeRequiredModal` when a server action returns `upgradePrompt` with an error.
 * Dismiss with "No thanks" until the next failed attempt (new `error` / `upgradePrompt` pair).
 */
export function usePlanLimitModal(
  state: StateWithUpgrade,
  options?: UsePlanLimitModalOptions,
) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (state.upgradePrompt && state.error) {
      setDismissed(false);
    }
  }, [state.error, state.upgradePrompt, options?.attemptKey]);

  const modalPrompt =
    state.upgradePrompt && state.error && !dismissed ? state.upgradePrompt : null;

  return {
    modalPrompt,
    closeModal: () => setDismissed(true),
  };
}
