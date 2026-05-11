import "server-only";

import { requireAuthenticatedAppUser } from "@/features/auth/api/profiles";
import {
  billingPlans,
  resolveBillingPlanTier,
  type BillingPlanTier,
} from "@/features/settings/lib/subscription-plans";

export type BillingSnapshot = Readonly<{
  planTier: BillingPlanTier;
  planLabel: string;
  billingCycle: "monthly";
  renewalDateLabel: string;
  usage: Readonly<{
    usedStorageLabel: string;
    storagePercent: number;
    activeMembersLabel: string;
    membersPercent: number;
    usedBandwidthLabel: string;
    bandwidthPercent: number;
    activeWorkOrdersLabel: string;
  }>;
}>;

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
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
  const usedStorage = 0;
  const usedBandwidth = profile.monthlyBandwidthUsedBytes;
  const renewalDate = new Date();
  renewalDate.setMonth(renewalDate.getMonth() + 1);

  const storageCap = plan.limits.storageBytes;
  const bandwidthCap = plan.limits.monthlyBandwidthBytes;
  const membersCap = plan.limits.maxActiveMembers;
  const storagePercent = storageCap ? clampPercent((usedStorage / storageCap) * 100) : 0;
  const bandwidthPercent = bandwidthCap ? clampPercent((usedBandwidth / bandwidthCap) * 100) : 0;
  const membersPercent = membersCap ? clampPercent((activeMembers / membersCap) * 100) : 0;

  return {
    planTier,
    planLabel: plan.label,
    billingCycle: "monthly",
    renewalDateLabel: renewalDate.toLocaleDateString("en-CA", {
      month: "long",
      day: "numeric",
      year: "numeric",
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
