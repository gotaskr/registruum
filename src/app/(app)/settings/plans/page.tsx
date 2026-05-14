import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getCurrentProfile } from "@/features/auth/api/profiles";
import { isBillingDisabled } from "@/features/settings/lib/billing-feature-flag";
import { BillingPlansPageContent } from "@/features/settings/ui/billing-plans-page-content";
import { getSpacesForUser } from "@/features/spaces/api/spaces";

export const metadata: Metadata = {
  title: "Plans & pricing",
};

export default async function BillingPlansPage() {
  if (isBillingDisabled()) {
    redirect("/settings?section=profile&billingStatus=billing_not_live");
  }

  const [profile, spaces] = await Promise.all([getCurrentProfile(), getSpacesForUser()]);

  return (
    <DashboardShell activeView="settings" spaces={spaces} profile={profile}>
      <BillingPlansPageContent profile={profile} />
    </DashboardShell>
  );
}
