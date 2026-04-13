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
      descriptionClassName="hidden sm:block"
      subheader={
        <div className="flex max-w-full flex-nowrap items-center gap-2 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden">
          <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-panel-muted px-2.5 py-1 text-xs text-muted sm:px-3 sm:py-1.5 sm:text-sm">
            <Shield className="h-3.5 w-3.5 shrink-0 text-accent sm:h-4 sm:w-4" />
            <span className="max-w-[10rem] truncate sm:max-w-none">{profile.fullName}</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-panel-muted px-2.5 py-1 text-xs text-muted sm:px-3 sm:py-1.5 sm:text-sm">
            <Mail className="h-3.5 w-3.5 shrink-0 text-accent sm:h-4 sm:w-4" />
            <span className="max-w-[12rem] truncate sm:max-w-none">{profile.email}</span>
          </span>
          <span className="hidden shrink-0 items-center gap-2 rounded-full bg-success-soft px-3 py-1.5 text-sm text-success-text sm:inline-flex">
            <CheckCircle2 className="h-4 w-4" />
            Secure account
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
