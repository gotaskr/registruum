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

type BillingPlansPageProps = Readonly<{
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>;

function firstQueryValue(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }

  return undefined;
}

export default async function BillingPlansPage({ searchParams }: BillingPlansPageProps) {
  if (isBillingDisabled()) {
    redirect("/settings?section=profile&billingStatus=billing_not_live");
  }

  const sp = (await searchParams) ?? {};
  const billingStatusFromUrl = firstQueryValue(sp.billingStatus);

  const [profile, spaces] = await Promise.all([getCurrentProfile(), getSpacesForUser()]);

  return (
    <DashboardShell activeView="settings" spaces={spaces} profile={profile}>
      <BillingPlansPageContent profile={profile} billingStatus={billingStatusFromUrl} />
    </DashboardShell>
  );
}
