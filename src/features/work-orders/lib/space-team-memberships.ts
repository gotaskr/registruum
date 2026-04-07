import "server-only";

import { isSpaceTeamRole, spaceTeamRoles } from "@/features/permissions/lib/roles";
import { isMissingSpaceMembershipStatusColumn } from "@/lib/supabase/schema-compat";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type AdminSupabase = ReturnType<typeof createSupabaseAdminClient>;
type SpaceMembershipRow = Database["public"]["Tables"]["space_memberships"]["Row"];
type WorkOrderRow = Database["public"]["Tables"]["work_orders"]["Row"];
type WorkOrderMembershipRow =
  Database["public"]["Tables"]["work_order_memberships"]["Row"];

async function getWorkOrderIdsForSpace(
  supabase: AdminSupabase,
  spaceId: string,
) {
  const { data, error } = await supabase
    .from("work_orders")
    .select("id")
    .eq("space_id", spaceId);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as Pick<WorkOrderRow, "id">[]).map((row) => row.id);
}

async function getActiveSpaceTeamMembershipsForSpace(
  supabase: AdminSupabase,
  spaceId: string,
) {
  let membershipQuery = await supabase
    .from("space_memberships")
    .select("user_id, role, invited_by_user_id")
    .eq("space_id", spaceId)
    .eq("status", "active");

  if (isMissingSpaceMembershipStatusColumn(membershipQuery.error)) {
    membershipQuery = await supabase
      .from("space_memberships")
      .select("user_id, role, invited_by_user_id")
      .eq("space_id", spaceId);
  }

  if (membershipQuery.error) {
    throw new Error(membershipQuery.error.message);
  }

  return ((membershipQuery.data ?? []) as Pick<
    SpaceMembershipRow,
    "user_id" | "role" | "invited_by_user_id"
  >[]).filter((membership) => isSpaceTeamRole(membership.role));
}

export async function syncSpaceTeamMembersIntoWorkOrder(input: {
  supabase: AdminSupabase;
  spaceId: string;
  workOrderId: string;
  assignedByUserId: string;
}) {
  const memberships = await getActiveSpaceTeamMembershipsForSpace(
    input.supabase,
    input.spaceId,
  );

  if (memberships.length === 0) {
    return;
  }

  const userIds = memberships.map((membership) => membership.user_id);
  const { data: existingRows, error: existingError } = await input.supabase
    .from("work_order_memberships")
    .select("id, user_id, role")
    .eq("work_order_id", input.workOrderId)
    .in("user_id", userIds);

  if (existingError) {
    throw new Error(existingError.message);
  }

  const existingByUserId = new Map(
    ((existingRows ?? []) as Pick<
      WorkOrderMembershipRow,
      "id" | "user_id" | "role"
    >[]).map((row) => [row.user_id, row] as const),
  );

  for (const membership of memberships) {
    const existingMembership = existingByUserId.get(membership.user_id);

    if (!existingMembership) {
      continue;
    }

    if (existingMembership.role === membership.role) {
      continue;
    }

    const { error: updateError } = await input.supabase
      .from("work_order_memberships")
      .update({
        role: membership.role,
        assigned_by_user_id:
          membership.invited_by_user_id ?? input.assignedByUserId,
      })
      .eq("id", existingMembership.id);

    if (updateError) {
      throw new Error(updateError.message);
    }
  }

  const missingRows = memberships
    .filter((membership) => !existingByUserId.has(membership.user_id))
    .map((membership) => ({
      work_order_id: input.workOrderId,
      user_id: membership.user_id,
      role: membership.role,
      assigned_by_user_id:
        membership.invited_by_user_id ?? input.assignedByUserId,
    }));

  if (missingRows.length === 0) {
    return;
  }

  const { error: insertError } = await input.supabase
    .from("work_order_memberships")
    .insert(missingRows);

  if (insertError) {
    throw new Error(insertError.message);
  }
}

export async function syncSpaceTeamMembershipAcrossExistingWorkOrders(input: {
  supabase: AdminSupabase;
  spaceId: string;
  userId: string;
  role: SpaceMembershipRow["role"];
  assignedByUserId: string;
}) {
  if (!isSpaceTeamRole(input.role)) {
    return;
  }

  const workOrderIds = await getWorkOrderIdsForSpace(input.supabase, input.spaceId);

  if (workOrderIds.length === 0) {
    return;
  }

  const { data: existingRows, error: existingError } = await input.supabase
    .from("work_order_memberships")
    .select("id, work_order_id, role")
    .eq("user_id", input.userId)
    .in("work_order_id", workOrderIds);

  if (existingError) {
    throw new Error(existingError.message);
  }

  const existingByWorkOrderId = new Map(
    ((existingRows ?? []) as Pick<
      WorkOrderMembershipRow,
      "id" | "work_order_id" | "role"
    >[]).map((row) => [row.work_order_id, row] as const),
  );

  for (const workOrderId of workOrderIds) {
    const existingMembership = existingByWorkOrderId.get(workOrderId);

    if (!existingMembership || existingMembership.role === input.role) {
      continue;
    }

    const { error: updateError } = await input.supabase
      .from("work_order_memberships")
      .update({
        role: input.role,
        assigned_by_user_id: input.assignedByUserId,
      })
      .eq("id", existingMembership.id);

    if (updateError) {
      throw new Error(updateError.message);
    }
  }

  const missingRows = workOrderIds
    .filter((workOrderId) => !existingByWorkOrderId.has(workOrderId))
    .map((workOrderId) => ({
      work_order_id: workOrderId,
      user_id: input.userId,
      role: input.role,
      assigned_by_user_id: input.assignedByUserId,
    }));

  if (missingRows.length === 0) {
    return;
  }

  const { error: insertError } = await input.supabase
    .from("work_order_memberships")
    .insert(missingRows);

  if (insertError) {
    throw new Error(insertError.message);
  }
}

export async function removeInheritedSpaceTeamMembershipsFromExistingWorkOrders(
  input: {
    supabase: AdminSupabase;
    spaceId: string;
    userId: string;
  },
) {
  const workOrderIds = await getWorkOrderIdsForSpace(input.supabase, input.spaceId);

  if (workOrderIds.length === 0) {
    return;
  }

  const { error } = await input.supabase
    .from("work_order_memberships")
    .delete()
    .eq("user_id", input.userId)
    .in("work_order_id", workOrderIds)
    .in("role", [...spaceTeamRoles]);

  if (error) {
    throw new Error(error.message);
  }
}
