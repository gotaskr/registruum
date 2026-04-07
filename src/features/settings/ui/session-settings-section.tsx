import { Laptop2, LogOut, ShieldCheck } from "lucide-react";
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
      description="Inspect the active device footprint and end your current authenticated session when needed."
    >
      <div className="space-y-5">
        <div className="rounded-[1.6rem] border border-border bg-panel-muted p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-panel text-accent shadow-[0_10px_18px_rgba(15,23,42,0.04)] dark:shadow-none">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">Current authenticated shell</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                This panel shows the browser session that is currently authorized to use Registruum.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-[1.5rem] border border-border bg-panel-muted px-4 py-4">
            <div className="flex items-center gap-2">
              <Laptop2 className="h-4 w-4 text-accent" />
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Current Device</p>
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">{session.deviceLabel}</p>
          </div>
          <div className="rounded-[1.5rem] border border-border bg-panel-muted px-4 py-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-accent" />
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Browser</p>
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">{session.browserLabel}</p>
          </div>
        </div>

        <SignOutButton className="inline-flex h-11 items-center justify-center rounded-2xl bg-accent px-5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(31,95,255,0.24)] dark:shadow-none">
          <LogOut className="mr-2 h-4 w-4" />
          Log Out
        </SignOutButton>
      </div>
    </SettingsCard>
  );
}
