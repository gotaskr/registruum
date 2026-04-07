import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getCurrentProfile } from "@/features/auth/api/profiles";
import { getSpacesForUser } from "@/features/spaces/api/spaces";
import { SpacesDashboard } from "@/features/spaces/ui/spaces-dashboard";

export default async function DashboardPage() {
  const [profile, spaces] = await Promise.all([
    getCurrentProfile(),
    getSpacesForUser(),
  ]);

  return (
    <DashboardShell spaces={spaces} profile={profile} sidebar={null}>
      <SpacesDashboard spaces={spaces} />
    </DashboardShell>
  );
}
