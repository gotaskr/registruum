import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  billingPlans,
  resolveBillingPlanTier,
  type BillingPlanDefinition,
} from "@/features/settings/lib/subscription-plans";
import type { UpgradePrompt } from "@/features/settings/types/upgrade-prompt";

function buildMemberLimitPrompt(planLabel: string, maxMembers: number): UpgradePrompt {
  return {
    title: "Upgrade required to add team members",
    reason: `${planLabel} allows up to ${maxMembers} active team member${maxMembers === 1 ? "" : "s"} in this space (space roster, not work-order assignees). Adding this user would exceed that limit.`,
    suggestedAction: "Upgrade your plan to add more team members and keep scaling your organization.",
  };
}

async function countActiveSpaceMembers(spaceId: string) {
  const adminSupabase = createSupabaseAdminClient();
  const { count, error } = await adminSupabase
    .from("space_memberships")
    .select("id", { count: "exact", head: true })
    .eq("space_id", spaceId)
    .eq("status", "active");

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

type SpaceOwnerBilling = Readonly<{
  plan: BillingPlanDefinition;
  ownerUserId: string;
}>;

async function getSpaceOwnerBilling(spaceId: string): Promise<SpaceOwnerBilling> {
  const adminSupabase = createSupabaseAdminClient();
  const { data: space, error: spaceError } = await adminSupabase
    .from("spaces")
    .select("created_by_user_id")
    .eq("id", spaceId)
    .single();

  if (spaceError || !space) {
    throw new Error(spaceError?.message ?? "Space could not be found.");
  }

  const { data: ownerProfile, error: ownerError } = await adminSupabase
    .from("profiles")
    .select("billing_plan_tier")
    .eq("id", space.created_by_user_id)
    .single();

  if (ownerError || !ownerProfile) {
    throw new Error(ownerError?.message ?? "Space billing profile could not be found.");
  }

  const planTier = resolveBillingPlanTier(ownerProfile.billing_plan_tier);
  const plan = billingPlans[planTier];

  return { plan, ownerUserId: space.created_by_user_id };
}

async function getSpaceOwnerPlan(spaceId: string) {
  const { plan } = await getSpaceOwnerBilling(spaceId);
  return plan;
}

async function countActiveWorkOrdersForBillingOwner(ownerUserId: string) {
  const adminSupabase = createSupabaseAdminClient();
  const { data: spaces, error: spacesError } = await adminSupabase
    .from("spaces")
    .select("id")
    .eq("created_by_user_id", ownerUserId);

  if (spacesError) {
    throw new Error(spacesError.message);
  }

  const spaceIds = (spaces ?? []).map((row) => row.id);
  if (spaceIds.length === 0) {
    return 0;
  }

  const { count, error } = await adminSupabase
    .from("work_orders")
    .select("id", { count: "exact", head: true })
    .in("space_id", spaceIds)
    .neq("status", "archived");

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

/** When non-null, creation should be blocked and the string shown to the user. */
export async function getWorkOrderCreationBlockedMessage(spaceId: string): Promise<string | null> {
  const { plan, ownerUserId } = await getSpaceOwnerBilling(spaceId);
  const cap = plan.limits.maxActiveWorkOrders;
  if (cap == null) {
    return null;
  }

  const activeCount = await countActiveWorkOrdersForBillingOwner(ownerUserId);
  if (activeCount >= cap) {
    return `${plan.label} allows up to ${cap} active work orders at a time (non-archived). Archive a work order to create a new one.`;
  }

  return null;
}

async function isAlreadyActiveMember(spaceId: string, userId: string) {
  const adminSupabase = createSupabaseAdminClient();
  const { data, error } = await adminSupabase
    .from("space_memberships")
    .select("id")
    .eq("space_id", spaceId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

export async function getMemberLimitUpgradePrompt(input: {
  spaceId: string;
  targetUserId: string;
}): Promise<UpgradePrompt | null> {
  const alreadyMember = await isAlreadyActiveMember(input.spaceId, input.targetUserId);
  if (alreadyMember) {
    return null;
  }

  const [plan, activeCount] = await Promise.all([
    getSpaceOwnerPlan(input.spaceId),
    countActiveSpaceMembers(input.spaceId),
  ]);

  if (plan.limits.maxActiveMembers === null) {
    return null;
  }

  if (activeCount >= plan.limits.maxActiveMembers) {
    return buildMemberLimitPrompt(plan.label, plan.limits.maxActiveMembers);
  }

  return null;
}

export async function getMemberLimitUpgradePromptForNewInvite(spaceId: string): Promise<UpgradePrompt | null> {
  const [plan, activeCount] = await Promise.all([
    getSpaceOwnerPlan(spaceId),
    countActiveSpaceMembers(spaceId),
  ]);

  if (plan.limits.maxActiveMembers === null) {
    return null;
  }

  if (activeCount >= plan.limits.maxActiveMembers) {
    return buildMemberLimitPrompt(plan.label, plan.limits.maxActiveMembers);
  }

  return null;
}
