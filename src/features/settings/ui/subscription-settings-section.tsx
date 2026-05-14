import Link from "next/link";
import { CheckCircle2, CreditCard, FolderKanban } from "lucide-react";
import { billingPlans, resolveBillingPlanTier } from "@/features/settings/lib/subscription-plans";
import type { BillingSnapshot } from "@/features/settings/types/billing-snapshot";
import { PlanStorageUsageCard } from "@/features/settings/ui/plan-storage-usage-card";
import { SettingsCard } from "@/features/settings/ui/settings-card";
import type { Profile } from "@/types/profile";

type SubscriptionSettingsSectionProps = Readonly<{
  profile: Profile;
  billingSnapshot: BillingSnapshot | null;
}>;

function cycleLabel(cycle: BillingSnapshot["billingCycle"]) {
  return cycle === "monthly" ? "Monthly" : cycle;
}

export function SubscriptionSettingsSection({ profile, billingSnapshot }: SubscriptionSettingsSectionProps) {
  const tier = resolveBillingPlanTier(profile.billingPlanTier);
  const plan = billingPlans[tier];
  const planLabel = billingSnapshot?.planLabel ?? plan.label;
  const renewalDateLabel = billingSnapshot?.renewalDateLabel ?? "—";
  const billingCycle = billingSnapshot ? cycleLabel(billingSnapshot.billingCycle) : "Monthly";
  const usage = billingSnapshot?.usage;

  return (
    <SettingsCard
      id="subscription"
      label="Billing"
      title="Plan and billing controls"
      description="Keep an eye on plan status, renewal timing, and workspace usage from one Registruum billing surface."
      highlighted
    >
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[1.4rem] border border-border bg-panel px-4 py-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Current Plan</p>
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">{planLabel}</p>
            {profile.billingStatus ? (
              <p className="mt-1 text-xs capitalize text-muted">{profile.billingStatus.replace(/_/g, " ")}</p>
            ) : null}
          </div>
          <div className="rounded-[1.4rem] border border-border bg-panel px-4 py-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-accent" />
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Billing Cycle</p>
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">{billingCycle}</p>
          </div>
          <div className="rounded-[1.4rem] border border-border bg-panel px-4 py-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Renewal / next bill</p>
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">{renewalDateLabel}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <PlanStorageUsageCard
            usedStorageLabel={usage?.usedStorageLabel ?? "—"}
            storagePercent={usage?.storagePercent ?? 0}
          />

          <div className="rounded-[1.6rem] border border-border bg-panel p-5">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-accent" />
              <p className="text-base font-semibold text-foreground">Members usage</p>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-muted">Active seats</span>
              <span className="font-medium text-foreground">
                {usage?.activeMembersLabel ?? "—"}
              </span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-border">
              <div
                className="h-2 rounded-full bg-accent"
                style={{ width: `${usage?.membersPercent ?? 0}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/settings/plans"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-accent px-5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(31,95,255,0.24)] transition-opacity hover:opacity-95 dark:shadow-none"
          >
            {tier === "free" ? "Upgrade plan" : "Change plan"}
          </Link>
          <a
            href="/api/billing/portal"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-panel px-5 text-sm font-medium text-foreground transition-colors hover:bg-panel-muted"
          >
            Manage billing
          </a>
        </div>
      </div>
    </SettingsCard>
  );
}
