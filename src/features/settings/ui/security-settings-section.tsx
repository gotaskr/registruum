"use client";

import { useActionState } from "react";
import { KeyRound, ShieldCheck, ShieldX } from "lucide-react";
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
      description="Refresh your credentials and lock down old sessions with the same Registruum control pattern."
    >
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-[1.4rem] border border-border bg-panel-muted px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
              Password
            </p>
            <p className="mt-3 text-sm font-medium text-foreground">
              Rotate your password regularly and keep it unique to Registruum.
            </p>
          </div>
          <div className="rounded-[1.4rem] border border-border bg-panel-muted px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
              Sessions
            </p>
            <p className="mt-3 text-sm font-medium text-foreground">
              End access on any device you no longer trust or use.
            </p>
          </div>
        </div>

        <form action={formAction} className="rounded-[1.6rem] border border-border bg-panel-muted p-5">
          <div className="grid gap-4">
            <label className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
                Current Password
              </span>
              <div className="relative">
                <input
                  name="currentPassword"
                  type="password"
                  placeholder="Current password"
                  autoComplete="current-password"
                  className="h-12 w-full rounded-2xl border border-border bg-panel px-4 pl-11 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent"
                />
                <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              </div>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
                  New Password
                </span>
                <div className="relative">
                  <input
                    name="newPassword"
                    type="password"
                    placeholder="New password"
                    autoComplete="new-password"
                    className="h-12 w-full rounded-2xl border border-border bg-panel px-4 pl-11 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent"
                  />
                  <ShieldCheck className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                </div>
              </label>

              <label className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
                  Confirm Password
                </span>
                <div className="relative">
                  <input
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    className="h-12 w-full rounded-2xl border border-border bg-panel px-4 pl-11 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent"
                  />
                  <ShieldCheck className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                </div>
              </label>
            </div>
          </div>

          <FormMessage
            message={state.error ?? state.success}
            tone={state.error ? "error" : "info"}
          />

          <div className="flex flex-wrap gap-2 pt-4">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-accent px-5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(31,95,255,0.24)] disabled:opacity-60 dark:shadow-none"
            >
              {isPending ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>

        <div className="rounded-[1.6rem] border border-border bg-panel p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 dark:bg-rose-500/15 dark:text-rose-300">
              <ShieldX className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">End all other sessions</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Log out every browser and device currently tied to this account, except the one you are using now.
              </p>
            </div>
          </div>
          <form action={signOutAllDevices} className="pt-4">
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-panel-muted px-5 text-sm font-medium text-foreground transition-colors hover:bg-accent-soft"
            >
              Log Out From All Devices
            </button>
          </form>
        </div>
      </div>
    </SettingsCard>
  );
}
