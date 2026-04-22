import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getCurrentProfile } from "@/features/auth/api/profiles";
import { getCompletedWorkOrderHistoryForCurrentUser } from "@/features/history/api/history";
import { HistoryScreen } from "@/features/history/ui/history-screen";
import { getSpacesForUser } from "@/features/spaces/api/spaces";

export default async function HistoryPage() {
  const [profile, spaces, items] = await Promise.all([
    getCurrentProfile(),
    getSpacesForUser(),
    getCompletedWorkOrderHistoryForCurrentUser(),
  ]);

  return (
    <DashboardShell spaces={spaces} profile={profile} sidebar={null}>
      <HistoryScreen items={items} />
    </DashboardShell>
  );
}
