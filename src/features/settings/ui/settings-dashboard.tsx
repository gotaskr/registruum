import { MainShell } from "@/components/layout/main-shell";
import { CheckCircle2, Mail, Shield } from "lucide-react";
import type { ThemePreference } from "@/features/settings/lib/preferences";
import type { SessionDetails } from "@/features/settings/lib/session-details";
import type { SettingsInvitation } from "@/features/settings/types/invitation";
import { SettingsSectionView } from "@/features/settings/ui/settings-section-view";
import type { Profile } from "@/types/profile";

type SettingsDashboardProps = Readonly<{
  profile: Profile;
  session: SessionDetails;
  currentTheme: ThemePreference;
  invitations: SettingsInvitation[];
}>;

export function SettingsDashboard({
  profile,
  session,
  currentTheme,
  invitations,
}: SettingsDashboardProps) {
  return (
    <MainShell
      title="Settings"
      description="Operational account controls for your Registruum workspace."
      subheader={
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-panel-muted px-3 py-1.5 text-sm text-muted">
            <Shield className="h-4 w-4 text-accent" />
            {profile.fullName}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-panel-muted px-3 py-1.5 text-sm text-muted">
            <Mail className="h-4 w-4 text-accent" />
            {profile.email}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-success-soft px-3 py-1.5 text-sm text-success-text">
            <CheckCircle2 className="h-4 w-4" />
            Infrastructure-grade account controls
          </span>
        </div>
      }
    >
      <SettingsSectionView
        profile={profile}
        session={session}
        canManagePassword={profile.canManagePassword}
        currentTheme={currentTheme}
        invitations={invitations}
      />
    </MainShell>
  );
}
