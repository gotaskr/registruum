"use client";

import { useActionState } from "react";
import { FormMessage } from "@/features/auth/ui/form-message";
import {
  signOutAllDevices,
  updatePassword,
} from "@/features/settings/actions/security.actions";
import { SettingsCard } from "@/features/settings/ui/settings-card";
import {
  initialSecurityActionState,
} from "@/features/settings/types/security-action-state";

export function SecuritySettingsSection() {
  const [state, formAction, isPending] = useActionState(
    updatePassword,
    initialSecurityActionState,
  );

  return (
    <SettingsCard
      id="security"
      label="Security"
      title="Password and access hygiene"
      description="Keep your account secure with a straightforward password update flow."
    >
      <div className="space-y-5">
        <form action={formAction} className="space-y-3">
          <input
            name="currentPassword"
            type="password"
            placeholder="Current password"
            autoComplete="current-password"
            className="h-10 w-full rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none"
          />
          <input
            name="newPassword"
            type="password"
            placeholder="New password"
            autoComplete="new-password"
            className="h-10 w-full rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none"
          />
          <input
            name="confirmPassword"
            type="password"
            placeholder="Confirm new password"
            autoComplete="new-password"
            className="h-10 w-full rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none"
          />

          <FormMessage
            message={state.error ?? state.success}
            tone={state.error ? "error" : "info"}
          />

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isPending ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>

        <div className="border-t border-border pt-4">
          <p className="text-sm text-muted">
            End all active sessions tied to this account across other devices and browsers.
          </p>
          <form action={signOutAllDevices} className="pt-3">
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-panel px-4 text-sm font-medium text-foreground"
            >
              Log Out From All Devices
            </button>
          </form>
        </div>
      </div>
    </SettingsCard>
  );
}
