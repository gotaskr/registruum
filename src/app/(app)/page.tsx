import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getCurrentProfile } from "@/features/auth/api/profiles";
import { getSpacesForUser } from "@/features/spaces/api/spaces";
import { JobMarketDashboard } from "@/features/job-market/ui/job-market-dashboard";
import { JobMarketSidebar } from "@/features/job-market/ui/job-market-sidebar";
import { getSpaceEntryHref } from "@/lib/route-utils";

export default async function DashboardPage() {
  const [profile, spaces] = await Promise.all([getCurrentProfile(), getSpacesForUser()]);

  if (profile.defaultLandingPage === "last_space" && spaces.length > 0) {
    redirect(getSpaceEntryHref(spaces[0]));
  }

  return (
    <DashboardShell
      spaces={spaces}
      profile={profile}
      sidebar={<JobMarketSidebar spaces={spaces} />}
    >
      <JobMarketDashboard spaces={spaces} />
    </DashboardShell>
  );
}
