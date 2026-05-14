import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SettingsBottomNav } from "@/components/layout/settings-bottom-nav";
import { getAuthenticatedAppUserOrNull, getCurrentProfile } from "@/features/auth/api/profiles";
import { getSettingsInvitations } from "@/features/settings/api/invitations";
import { syncBillingFromStripeCheckoutSession } from "@/features/settings/api/checkout-billing-sync";
import { getBillingSnapshotForCurrentUser } from "@/features/settings/api/subscription";
import { resolveThemePreference, themeCookieName } from "@/features/settings/lib/preferences";
import { getSessionDetails } from "@/features/settings/lib/session-details";
import { getSpacesForUser } from "@/features/spaces/api/spaces";
import { SettingsDashboard } from "@/features/settings/ui/settings-dashboard";
import { SettingsSidebar } from "@/features/settings/ui/settings-sidebar";

type SettingsPageProps = Readonly<{
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

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const sp = (await searchParams) ?? {};
  const sessionId = firstQueryValue(sp.session_id);
  const billingStatus = firstQueryValue(sp.billingStatus);
  const checkoutPlan = firstQueryValue(sp.checkout_plan);

  if (sessionId && billingStatus === "checkout_success") {
    const auth = await getAuthenticatedAppUserOrNull();
    if (auth) {
      const syncResult = await syncBillingFromStripeCheckoutSession({
        sessionId,
        userId: auth.user.id,
        checkoutPlanFromUrl: checkoutPlan,
      });
      if (syncResult === "forbidden") {
        redirect("/settings?section=subscription&billingStatus=sync_forbidden");
      }
      redirect("/settings?section=subscription");
    }
  }

  const [profile, spaces, invitations, billingSnapshot] = await Promise.all([
    getCurrentProfile(),
    getSpacesForUser(),
    getSettingsInvitations(),
    getBillingSnapshotForCurrentUser().catch(() => null),
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
        billingSnapshot={billingSnapshot}
      />
    </DashboardShell>
  );
}
