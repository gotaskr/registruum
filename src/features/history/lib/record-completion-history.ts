import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isMissingSpaceMembershipStatusColumn } from "@/lib/supabase/schema-compat";
/**
 * Inserts one immutable history row per user tied to the work order at completion
 * (all work order members plus the owner when not already a member). Idempotent per
 * (user_id, work_order_id). Uses the service role client; never exposed to the browser.
 */
export async function recordCompletedWorkOrderHistoryForCompletion(input: Readonly<{
  spaceId: string;
  workOrderId: string;
  completedAtIso: string;
  workOrderTitle: string;
  ownerUserId: string;
}>): Promise<void> {
  const admin = createSupabaseAdminClient();

  const { data: spaceRow, error: spaceError } = await admin
    .from("spaces")
    .select("name")
    .eq("id", input.spaceId)
    .maybeSingle();

  if (spaceError) {
    throw new Error(spaceError.message);
  }

  const spaceName = spaceRow?.name?.trim() || "Space";

  const { data: membershipRows, error: membershipError } = await admin
    .from("work_order_memberships")
    .select("user_id, role")
    .eq("work_order_id", input.workOrderId);

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  const recipients = new Map<string, string>();

  for (const row of membershipRows ?? []) {
    recipients.set(row.user_id, row.role);
  }

  if (input.ownerUserId && !recipients.has(input.ownerUserId)) {
    let ownerMembershipQuery = await admin
      .from("space_memberships")
      .select("role")
      .eq("space_id", input.spaceId)
      .eq("user_id", input.ownerUserId)
      .eq("status", "active")
      .maybeSingle();

    if (isMissingSpaceMembershipStatusColumn(ownerMembershipQuery.error)) {
      ownerMembershipQuery = await admin
        .from("space_memberships")
        .select("role")
        .eq("space_id", input.spaceId)
        .eq("user_id", input.ownerUserId)
        .maybeSingle();
    }

    const { data: ownerSm, error: ownerSmError } = ownerMembershipQuery;

    if (ownerSmError && !isMissingSpaceMembershipStatusColumn(ownerSmError)) {
      throw new Error(ownerSmError.message);
    }

    recipients.set(input.ownerUserId, ownerSm?.role ?? "Owner");
  }

  for (const [userId, roleSnapshot] of recipients) {
    const { error } = await admin.from("completed_work_order_history").insert({
      user_id: userId,
      work_order_id: input.workOrderId,
      space_id: input.spaceId,
      completed_at: input.completedAtIso,
      space_name_snapshot: spaceName,
      work_order_title_snapshot: input.workOrderTitle,
      role_snapshot: roleSnapshot,
    });

    if (error?.code === "23505") {
      continue;
    }

    if (error) {
      throw new Error(error.message);
    }
  }
}
