import type { Metadata } from "next";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getCurrentProfile } from "@/features/auth/api/profiles";
import { BillingPlansPageContent } from "@/features/settings/ui/billing-plans-page-content";
import { getSpacesForUser } from "@/features/spaces/api/spaces";

export const metadata: Metadata = {
  title: "Plans & pricing",
};

export default async function BillingPlansPage() {
  const [profile, spaces] = await Promise.all([getCurrentProfile(), getSpacesForUser()]);

  return (
    <DashboardShell activeView="settings" spaces={spaces} profile={profile}>
      <BillingPlansPageContent profile={profile} />
    </DashboardShell>
  );
}
