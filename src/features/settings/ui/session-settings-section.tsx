import { SignOutButton } from "@/features/auth/ui/sign-out-button";
import { SettingsCard } from "@/features/settings/ui/settings-card";
import type { SessionDetails } from "@/features/settings/lib/session-details";

type SessionSettingsSectionProps = Readonly<{
  session: SessionDetails;
}>;

export function SessionSettingsSection({
  session,
}: SessionSettingsSectionProps) {
  return (
    <SettingsCard
      id="session"
      label="Session"
      title="Current session state"
      description="Inspect the active device and end the current authenticated session."
    >
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-panel-muted px-3 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Current Device</p>
            <p className="mt-2 text-sm font-semibold text-foreground">{session.deviceLabel}</p>
          </div>
          <div className="rounded-lg border border-border bg-panel-muted px-3 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Browser</p>
            <p className="mt-2 text-sm font-semibold text-foreground">{session.browserLabel}</p>
          </div>
        </div>
        <SignOutButton className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white">
          Log Out
        </SignOutButton>
      </div>
    </SettingsCard>
  );
}
