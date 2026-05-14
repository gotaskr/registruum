import "server-only";

import { requireAuthenticatedAppUser } from "@/features/auth/api/profiles";
import {
  fetchCurrentPeriodEndIsoFromStripeForSupabaseUser,
  updateProfileBillingFields,
} from "@/features/settings/api/billing-profile-update";
import { getOwnedSpacesDocumentStorageBytes } from "@/features/settings/api/storage";
import {
  billingPlans,
  resolveBillingPlanTier,
  type BillingPlanTier,
} from "@/features/settings/lib/subscription-plans";
import type { BillingSnapshot } from "@/features/settings/types/billing-snapshot";

export type { BillingSnapshot };

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

function formatBillingDateLabel(iso: string | null): string | null {
  if (!iso) {
    return null;
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return d.toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" });
}

function resolveRenewalDateLabel(input: Readonly<{
  planTier: BillingPlanTier;
  billingStatus: string;
  trialEndsAt: string | null;
  periodEndsAt: string | null;
}>): string {
  if (input.planTier === "free") {
    return "—";
  }

  const trialLabel = formatBillingDateLabel(input.trialEndsAt);
  if (input.billingStatus === "trialing" && trialLabel) {
    return `Trial ends ${trialLabel}`;
  }

  const periodEndLabel = formatBillingDateLabel(input.periodEndsAt);
  if (periodEndLabel) {
    return periodEndLabel;
  }

  if (trialLabel) {
    return `Trial ends ${trialLabel}`;
  }

  return "—";
}

function coerceProfileBillingStatusForUpdate(
  raw: string,
): "active" | "trialing" | "past_due" | "canceled" {
  switch (raw) {
    case "active":
    case "trialing":
    case "past_due":
    case "canceled":
      return raw;
    default:
      return "active";
  }
}

function formatBytes(value: number) {
  const gb = 1024 * 1024 * 1024;
  const tb = 1024 * gb;

  if (value >= tb) {
    return `${Math.round((value / tb) * 10) / 10} TB`;
  }

  if (value >= gb) {
    return `${Math.round((value / gb) * 10) / 10} GB`;
  }

  return `${Math.round(value / (1024 * 1024))} MB`;
}

export async function getBillingSnapshotForCurrentUser(): Promise<BillingSnapshot> {
  const { supabase, user, profile } = await requireAuthenticatedAppUser();
  const planTier = resolveBillingPlanTier(profile.billingPlanTier);
  const plan = billingPlans[planTier];

  const [spacesResult, memberResult, ownedSpacesResult] = await Promise.all([
    supabase
      .from("spaces")
      .select("id", { count: "exact", head: true })
      .eq("created_by_user_id", user.id),
    supabase
      .from("space_memberships")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "active"),
    supabase.from("spaces").select("id").eq("created_by_user_id", user.id),
  ]);

  if (spacesResult.error) {
    throw new Error(spacesResult.error.message);
  }

  if (memberResult.error) {
    throw new Error(memberResult.error.message);
  }

  if (ownedSpacesResult.error) {
    throw new Error(ownedSpacesResult.error.message);
  }

  const ownedSpaceIds = (ownedSpacesResult.data ?? []).map((row) => row.id);
  let activeWorkOrders = 0;
  if (ownedSpaceIds.length > 0) {
    const { count, error: workOrderCountError } = await supabase
      .from("work_orders")
      .select("id", { count: "exact", head: true })
      .in("space_id", ownedSpaceIds)
      .neq("status", "archived");

    if (workOrderCountError) {
      throw new Error(workOrderCountError.message);
    }

    activeWorkOrders = count ?? 0;
  }

  const activeMembers = memberResult.count ?? 0;
  const usedStorage = await getOwnedSpacesDocumentStorageBytes();
  const usedBandwidth = profile.monthlyBandwidthUsedBytes;
  const storageCap = plan.limits.storageBytes;
  const bandwidthCap = plan.limits.monthlyBandwidthBytes;
  const membersCap = plan.limits.maxActiveMembers;
  const storagePercent = storageCap ? clampPercent((usedStorage / storageCap) * 100) : 0;
  const bandwidthPercent = bandwidthCap ? clampPercent((usedBandwidth / bandwidthCap) * 100) : 0;
  const membersPercent = membersCap ? clampPercent((activeMembers / membersCap) * 100) : 0;

  let periodEndsAt: string | null = profile.billingCurrentPeriodEndsAt;
  const hasPeriodLabel = formatBillingDateLabel(periodEndsAt) !== null;
  const trialCoversRenewal =
    profile.billingStatus === "trialing" && formatBillingDateLabel(profile.billingTrialEndsAt) !== null;

  if (planTier !== "free" && !hasPeriodLabel && !trialCoversRenewal) {
    const recovered = await fetchCurrentPeriodEndIsoFromStripeForSupabaseUser(user.id);
    if (recovered) {
      periodEndsAt = recovered;
      try {
        await updateProfileBillingFields({
          userId: user.id,
          tier: planTier,
          billingStatus: coerceProfileBillingStatusForUpdate(profile.billingStatus),
          trialEndsAtIso: profile.billingTrialEndsAt,
          cycleAnchorIso: profile.billingCycleAnchor,
          currentPeriodEndsAtIso: recovered,
        });
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : String(cause);
        console.warn("[billing] persist recovered period end failed", message);
      }
    }
  }

  return {
    planTier,
    planLabel: plan.label,
    billingCycle: "monthly",
    renewalDateLabel: resolveRenewalDateLabel({
      planTier,
      billingStatus: profile.billingStatus,
      trialEndsAt: profile.billingTrialEndsAt,
      periodEndsAt,
    }),
    usage: {
      usedStorageLabel: `${formatBytes(usedStorage)} / ${storageCap ? formatBytes(storageCap) : "Unlimited"}`,
      storagePercent,
      activeMembersLabel: membersCap
        ? `${activeMembers} / ${membersCap} team members`
        : `${activeMembers} team members`,
      membersPercent,
      usedBandwidthLabel: `${formatBytes(usedBandwidth)} / ${bandwidthCap ? formatBytes(bandwidthCap) : "Unlimited"}`,
      bandwidthPercent,
      activeWorkOrdersLabel: plan.limits.maxActiveWorkOrders
        ? `${activeWorkOrders} / ${plan.limits.maxActiveWorkOrders} active work orders`
        : `${activeWorkOrders} active work orders`,
    },
  };
}
