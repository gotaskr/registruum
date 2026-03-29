import { MainShell } from "@/components/layout/main-shell";
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
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
          <span>{profile.fullName}</span>
          <span>{profile.email}</span>
          <span>Infrastructure-grade account controls</span>
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
