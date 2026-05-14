import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  billingPlans,
  resolveBillingPlanTier,
  type BillingPlanDefinition,
} from "@/features/settings/lib/subscription-plans";
import { sumPlanStorageBytesForUser } from "@/features/settings/lib/plan-storage-usage";
import type { UpgradePrompt } from "@/features/settings/types/upgrade-prompt";

export function formatUpgradePromptError(prompt: UpgradePrompt): string {
  return `${prompt.title} ${prompt.reason}`;
}

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

function formatStorageOrBandwidthCapForMessage(bytes: number): string {
  const gb = 1024 * 1024 * 1024;
  const tb = 1024 * gb;

  if (bytes >= tb) {
    return `${Math.round((bytes / tb) * 10) / 10} TB`;
  }

  if (bytes >= gb) {
    return `${Math.round((bytes / gb) * 10) / 10} GB`;
  }

  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

async function countSpacesCreatedByUser(ownerUserId: string) {
  const adminSupabase = createSupabaseAdminClient();
  const { count, error } = await adminSupabase
    .from("spaces")
    .select("id", { count: "exact", head: true })
    .eq("created_by_user_id", ownerUserId);

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

export async function getSpaceCreationBlockedMessage(userId: string): Promise<string | null> {
  const adminSupabase = createSupabaseAdminClient();
  const { data: profile, error } = await adminSupabase
    .from("profiles")
    .select("billing_plan_tier")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    throw new Error(error?.message ?? "Profile could not be found.");
  }

  const plan = billingPlans[resolveBillingPlanTier(profile.billing_plan_tier)];
  const cap = plan.limits.maxSpaces;
  if (cap == null) {
    return null;
  }

  const spaceCount = await countSpacesCreatedByUser(userId);
  if (spaceCount >= cap) {
    return `${plan.label} allows up to ${cap} space${cap === 1 ? "" : "s"} you create. Delete a space or upgrade your plan to add another.`;
  }

  return null;
}

/**
 * Blocks uploads when the **space owner's** plan storage would be exceeded.
 * All work-order files in a space count toward the **creator's** plan (including uploads by invited
 * members). Collaborators' personal plan storage is not charged for those files. `completed_work_order_history`
 * remains per-user metadata only (no extra blobs).
 */
export async function getDocumentStorageUploadBlockedMessage(
  spaceId: string,
  additionalBytes: number,
  _uploadingUserId: string,
): Promise<string | null> {
  if (additionalBytes <= 0) {
    return null;
  }

  const { plan: ownerPlan, ownerUserId } = await getSpaceOwnerBilling(spaceId);
  const ownerCap = ownerPlan.limits.storageBytes;

  if (ownerCap != null) {
    const ownerUsed = await sumPlanStorageBytesForUser(ownerUserId);
    if (ownerUsed + additionalBytes > ownerCap) {
      return `${ownerPlan.label} (this space owner's plan) includes up to ${formatStorageOrBandwidthCapForMessage(ownerCap)} of file storage for workspaces they own. About ${formatStorageOrBandwidthCapForMessage(ownerUsed)} is in use. Permanently delete files to free space, or upgrade, before uploading more.`;
    }
  }

  return null;
}

/**
 * Uses `profiles.monthly_bandwidth_used_bytes` for the **space owner** vs plan limit.
 * Nothing in the app currently increments this field; when metering exists, uploads/downloads should update it.
 */
export async function getBandwidthBlockedMessageForSpace(spaceId: string): Promise<string | null> {
  const { plan, ownerUserId } = await getSpaceOwnerBilling(spaceId);
  const cap = plan.limits.monthlyBandwidthBytes;
  if (cap == null) {
    return null;
  }

  const adminSupabase = createSupabaseAdminClient();
  const { data: profile, error } = await adminSupabase
    .from("profiles")
    .select("monthly_bandwidth_used_bytes")
    .eq("id", ownerUserId)
    .single();

  if (error || !profile) {
    throw new Error(error?.message ?? "Profile could not be found.");
  }

  const used = Math.max(0, profile.monthly_bandwidth_used_bytes ?? 0);
  if (used >= cap) {
    return `${plan.label} includes up to ${formatStorageOrBandwidthCapForMessage(cap)} of bandwidth per month for this workspace. Usage is at the limit; upgrade your plan or wait for the next reset.`;
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
