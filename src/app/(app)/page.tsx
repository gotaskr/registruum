import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getCurrentProfile } from "@/features/auth/api/profiles";
import {
  getDashboardOnboardingSnapshot,
  getSpacesForUser,
} from "@/features/spaces/api/spaces";
import { SpacesDashboard } from "@/features/spaces/ui/spaces-dashboard";

export default async function DashboardPage() {
  const [profile, spaces, onboarding] = await Promise.all([
    getCurrentProfile(),
    getSpacesForUser(),
    getDashboardOnboardingSnapshot(),
  ]);

  return (
    <DashboardShell spaces={spaces} profile={profile} sidebar={null}>
      <SpacesDashboard
        profileId={profile.id}
        spaces={spaces}
        onboarding={onboarding}
      />
    </DashboardShell>
  );
}
