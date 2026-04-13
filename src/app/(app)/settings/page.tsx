import { cookies, headers } from "next/headers";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SettingsBottomNav } from "@/components/layout/settings-bottom-nav";
import { getCurrentProfile } from "@/features/auth/api/profiles";
import { getSettingsInvitations } from "@/features/settings/api/invitations";
import { resolveThemePreference, themeCookieName } from "@/features/settings/lib/preferences";
import { getSessionDetails } from "@/features/settings/lib/session-details";
import { getSpacesForUser } from "@/features/spaces/api/spaces";
import { SettingsDashboard } from "@/features/settings/ui/settings-dashboard";
import { SettingsSidebar } from "@/features/settings/ui/settings-sidebar";

export default async function SettingsPage() {
  const [profile, spaces, invitations] = await Promise.all([
    getCurrentProfile(),
    getSpacesForUser(),
    getSettingsInvitations(),
  ]);
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const session = getSessionDetails(requestHeaders.get("user-agent"));
  const currentTheme = resolveThemePreference(cookieStore.get(themeCookieName)?.value);

  return (
    <DashboardShell
      activeView="settings"
      spaces={spaces}
      profile={profile}
      sidebar={<SettingsSidebar canManagePassword={profile.canManagePassword} />}
      mobileBottomNav={
        <SettingsBottomNav canManagePassword={profile.canManagePassword} />
      }
    >
      <SettingsDashboard
        profile={profile}
        session={session}
        currentTheme={currentTheme}
        invitations={invitations}
      />
    </DashboardShell>
  );
}
