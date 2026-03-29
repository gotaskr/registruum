"use server";

import { revalidatePath } from "next/cache";
import { createActivityLog } from "@/features/logs/api/activity-logs";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getLockedWorkOrderMessage } from "@/features/permissions/lib/work-order-permissions";
import { getWorkOrderActorContextForAction } from "@/features/work-orders/api/work-orders";
import { isMissingSpaceMembershipStatusColumn } from "@/lib/supabase/schema-compat";
import {
  addWorkOrderMemberByCodeSchema,
  assignWorkOrderMemberSchema,
  cancelWorkOrderInviteSchema,
  createWorkOrderInviteSchema,
  previewWorkOrderMemberByCodeSchema,
  removeWorkOrderMemberSchema,
  updateWorkOrderMemberRoleSchema,
} from "@/features/members/schemas/member.schema";
import {
  initialWorkOrderMemberActionState,
  initialWorkOrderMemberCodePreviewState,
  type WorkOrderMemberActionState,
  type WorkOrderMemberCodePreviewState,
} from "@/features/members/types/work-order-member-action-state";
import { formatRoleLabel } from "@/lib/utils";
import type { Database } from "@/types/database";

type SpaceMembershipRow = Database["public"]["Tables"]["space_memberships"]["Row"];

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function normalizeUserCode(value: string) {
  const trimmed = value.trim().toUpperCase();
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

function buildInviteToken() {
  return crypto.randomUUID().replace(/-/g, "");
}

function getWorkOrderMembersPath(spaceId: string, workOrderId: string) {
  return `/space/${spaceId}/work-order/${workOrderId}/members`;
}

async function ensureWorkOrderManager(spaceId: string, workOrderId: string) {
  const context = await getWorkOrderActorContextForAction(spaceId, workOrderId);

  if (!context) {
    return null;
  }

  if (!context.permissions.canManageMembers) {
    return {
      error:
        getLockedWorkOrderMessage(context.workOrder.status) ??
        "You cannot manage members in this work order.",
      context: null,
    };
  }

  return {
    error: null,
    context,
  };
}

async function ensureInternalSpaceMembership(input: {
  supabase: Awaited<NonNullable<Awaited<ReturnType<typeof getWorkOrderActorContextForAction>>>>["supabase"];
  spaceId: string;
  userId: string;
  invitedByUserId: string;
  role: SpaceMembershipRow["role"];
}) {
  const { supabase, spaceId, userId, invitedByUserId, role } = input;
  let membershipQuery = await supabase
    .from("space_memberships")
    .select("id, status")
    .eq("space_id", spaceId)
    .eq("user_id", userId)
    .maybeSingle();

  if (isMissingSpaceMembershipStatusColumn(membershipQuery.error)) {
    membershipQuery = await supabase
      .from("space_memberships")
      .select("id")
      .eq("space_id", spaceId)
      .eq("user_id", userId)
      .maybeSingle();
  }

  const existingMembership = membershipQuery.data;

  if (!existingMembership) {
    const { error } = await supabase.from("space_memberships").insert({
      space_id: spaceId,
      user_id: userId,
      role,
      invited_by_user_id: invitedByUserId,
      status: "active",
    });

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  if ("status" in existingMembership && existingMembership.status === "removed") {
    const { error } = await supabase
      .from("space_memberships")
      .update({
        role,
        status: "active",
        invited_by_user_id: invitedByUserId,
        removed_by_user_id: null,
        removed_at: null,
      })
      .eq("id", existingMembership.id);

    if (error) {
      throw new Error(error.message);
    }
  }
}

async function ensureNotAlreadyAssigned(input: {
  supabase: Awaited<NonNullable<Awaited<ReturnType<typeof getWorkOrderActorContextForAction>>>>["supabase"];
  workOrderId: string;
  userId: string;
}) {
  const { data, error } = await input.supabase
    .from("work_order_memberships")
    .select("id")
    .eq("work_order_id", input.workOrderId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (data) {
    throw new Error("That user is already assigned to this work order.");
  }
}

export async function assignWorkOrderMember(
  previousState: WorkOrderMemberActionState = initialWorkOrderMemberActionState,
  formData: FormData,
): Promise<WorkOrderMemberActionState> {
  void previousState;
  const parsed = assignWorkOrderMemberSchema.safeParse({
    spaceId: readText(formData, "spaceId"),
    workOrderId: readText(formData, "workOrderId"),
    userId: readText(formData, "userId"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Unable to assign member.",
    };
  }

  const context = await getWorkOrderActorContextForAction(
    parsed.data.spaceId,
    parsed.data.workOrderId,
  );

  if (!context) {
    return {
      error: "You do not have access to this work order.",
    };
  }

  if (!context.permissions.canManageMembers) {
    return {
      error:
        getLockedWorkOrderMessage(context.workOrder.status) ??
        "You cannot manage members in this work order.",
    };
  }

  let targetMembershipQuery = await context.supabase
      .from("space_memberships")
      .select("role")
      .eq("space_id", parsed.data.spaceId)
      .eq("user_id", parsed.data.userId)
      .eq("status", "active")
      .single();

  if (isMissingSpaceMembershipStatusColumn(targetMembershipQuery.error)) {
    targetMembershipQuery = await context.supabase
      .from("space_memberships")
      .select("role")
      .eq("space_id", parsed.data.spaceId)
      .eq("user_id", parsed.data.userId)
      .single();
  }

  const {
    data: targetSpaceMembership,
    error: targetMembershipError,
  } = targetMembershipQuery;

  if (targetMembershipError || !targetSpaceMembership) {
    return {
      error: "Selected user is not a member of this space.",
    };
  }

  const { data: targetProfile, error: targetProfileError } = await context.supabase
    .from("profiles")
    .select("full_name")
    .eq("id", parsed.data.userId)
    .maybeSingle();

  if (targetProfileError) {
    return {
      error: targetProfileError.message,
    };
  }

  const { data: insertedRow, error: insertError } = await context.supabase
    .from("work_order_memberships")
    .insert({
      work_order_id: parsed.data.workOrderId,
      user_id: parsed.data.userId,
      role: targetSpaceMembership.role,
      assigned_by_user_id: context.user.id,
    })
    .select("id")
    .single();

  if (insertError || !insertedRow) {
    return {
      error: insertError?.message ?? "Unable to assign member.",
    };
  }

  await createActivityLog({
    supabase: context.supabase,
    action: "Assigned a work order member",
    actorUserId: context.user.id,
    spaceId: parsed.data.spaceId,
    workOrderId: parsed.data.workOrderId,
    entityType: "work_order_membership",
    entityId: insertedRow.id,
    details: {
      summary: targetProfile?.full_name ?? "a member",
    },
  });

  revalidatePath(
    getWorkOrderMembersPath(parsed.data.spaceId, parsed.data.workOrderId),
  );

  return {};
}

export async function createWorkOrderInvite(
  previousState: WorkOrderMemberActionState = initialWorkOrderMemberActionState,
  formData: FormData,
): Promise<WorkOrderMemberActionState> {
  void previousState;
  const parsed = createWorkOrderInviteSchema.safeParse({
    spaceId: readText(formData, "spaceId"),
    workOrderId: readText(formData, "workOrderId"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Unable to create invite.",
    };
  }

  const managed = await ensureWorkOrderManager(
    parsed.data.spaceId,
    parsed.data.workOrderId,
  );

  if (!managed?.context) {
    return {
      error: managed?.error ?? "You cannot manage members in this work order.",
    };
  }

  const { context } = managed;
  const adminSupabase = createSupabaseAdminClient();
  const { error: revokeError } = await adminSupabase
    .from("invites")
    .update({
      status: "revoked",
    })
    .eq("space_id", parsed.data.spaceId)
    .eq("status", "pending")
    .eq("method", "link")
    .contains("assigned_work_order_ids", [parsed.data.workOrderId]);

  if (revokeError) {
    return {
      error: revokeError.message,
    };
  }

  const token = buildInviteToken();
  const { data: invite, error } = await adminSupabase
    .from("invites")
    .insert({
      space_id: parsed.data.spaceId,
      invited_by_user_id: context.user.id,
      email: null,
      role: "member",
      token_hash: token,
      status: "pending",
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
      method: "link",
      message: null,
      assigned_work_order_ids: [parsed.data.workOrderId],
    })
    .select("id")
    .single();

  if (error || !invite) {
    return {
      error: error?.message ?? "Unable to create invite.",
    };
  }

  await createActivityLog({
    supabase: context.supabase,
    action: "Created a work order invite",
    actorUserId: context.user.id,
    spaceId: parsed.data.spaceId,
    workOrderId: parsed.data.workOrderId,
    entityType: "invite",
    entityId: invite.id,
    details: {
      summary: "Invite link",
    },
  });

  revalidatePath(getWorkOrderMembersPath(parsed.data.spaceId, parsed.data.workOrderId));

  return {
    success: "Invite link created.",
    inviteLink: `/invite/${token}`,
  };
}

export async function previewWorkOrderMemberByCode(
  previousState: WorkOrderMemberCodePreviewState = initialWorkOrderMemberCodePreviewState,
  formData: FormData,
): Promise<WorkOrderMemberCodePreviewState> {
  const parsed = previewWorkOrderMemberByCodeSchema.safeParse({
    spaceId: readText(formData, "spaceId"),
    workOrderId: readText(formData, "workOrderId"),
    userCode: readText(formData, "userCode"),
  });

  if (!parsed.success) {
    return {
      ...previousState,
      error: parsed.error.issues[0]?.message ?? "Unable to preview member.",
    };
  }

  const managed = await ensureWorkOrderManager(
    parsed.data.spaceId,
    parsed.data.workOrderId,
  );

  if (!managed?.context) {
    return {
      ...previousState,
      error: managed?.error ?? "You cannot manage members in this work order.",
    };
  }

  const normalizedCode = normalizeUserCode(parsed.data.userCode);
  const { data: profile, error: profileError } = await managed.context.supabase
    .from("profiles")
    .select("id, full_name, email, user_tag, email_verified_at")
    .eq("user_tag", normalizedCode)
    .maybeSingle();

  if (profileError) {
    return {
      ...previousState,
      error: profileError.message,
    };
  }

  if (!profile) {
    return {
      ...previousState,
      error: "No user was found for that member code.",
    };
  }

  try {
    await ensureNotAlreadyAssigned({
      supabase: managed.context.supabase,
      workOrderId: parsed.data.workOrderId,
      userId: profile.id,
    });
  } catch (error) {
    return {
      ...previousState,
      error: error instanceof Error ? error.message : "Unable to preview member.",
    };
  }

  return {
    error: undefined,
    preview: {
      userId: profile.id,
      name: profile.full_name,
      email: profile.email ?? "unknown@registruum.app",
      memberCode: profile.user_tag ?? normalizedCode,
      verificationState: profile.email_verified_at ? "verified" : "unverified",
    },
  };
}

export async function addWorkOrderMemberByCode(
  previousState: WorkOrderMemberActionState = initialWorkOrderMemberActionState,
  formData: FormData,
): Promise<WorkOrderMemberActionState> {
  void previousState;
  const parsed = addWorkOrderMemberByCodeSchema.safeParse({
    spaceId: readText(formData, "spaceId"),
    workOrderId: readText(formData, "workOrderId"),
    userCode: readText(formData, "userCode"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Unable to add member.",
    };
  }

  const managed = await ensureWorkOrderManager(
    parsed.data.spaceId,
    parsed.data.workOrderId,
  );

  if (!managed?.context) {
    return {
      error: managed?.error ?? "You cannot manage members in this work order.",
    };
  }

  const { context } = managed;
  const adminSupabase = createSupabaseAdminClient();
  const normalizedCode = normalizeUserCode(parsed.data.userCode);
  const { data: profile, error: profileError } = await context.supabase
    .from("profiles")
    .select("id, full_name, email, user_tag")
    .eq("user_tag", normalizedCode)
    .maybeSingle();

  if (profileError) {
    return {
      error: profileError.message,
    };
  }

  if (!profile) {
    return {
      error: "No user was found for that member code.",
    };
  }

  try {
    await ensureNotAlreadyAssigned({
      supabase: context.supabase,
      workOrderId: parsed.data.workOrderId,
      userId: profile.id,
    });
    await ensureInternalSpaceMembership({
      supabase: adminSupabase,
      spaceId: parsed.data.spaceId,
      userId: profile.id,
      invitedByUserId: context.user.id,
      role: "member",
    });

    const { data: insertedRow, error: insertError } = await adminSupabase
      .from("work_order_memberships")
      .insert({
        work_order_id: parsed.data.workOrderId,
        user_id: profile.id,
        role: "member",
        assigned_by_user_id: context.user.id,
      })
      .select("id")
      .single();

    if (insertError || !insertedRow) {
      return {
        error: insertError?.message ?? "Unable to add member.",
      };
    }

    await createActivityLog({
      supabase: context.supabase,
      action: "Added a work order member by code",
      actorUserId: context.user.id,
      spaceId: parsed.data.spaceId,
      workOrderId: parsed.data.workOrderId,
      entityType: "work_order_membership",
      entityId: insertedRow.id,
      details: {
        summary: profile.full_name,
      },
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to add member.",
    };
  }

  revalidatePath(getWorkOrderMembersPath(parsed.data.spaceId, parsed.data.workOrderId));

  return {
    success: "Member added.",
  };
}

export async function cancelWorkOrderInvite(
  previousState: WorkOrderMemberActionState = initialWorkOrderMemberActionState,
  formData: FormData,
): Promise<WorkOrderMemberActionState> {
  void previousState;
  const parsed = cancelWorkOrderInviteSchema.safeParse({
    spaceId: readText(formData, "spaceId"),
    workOrderId: readText(formData, "workOrderId"),
    inviteId: readText(formData, "inviteId"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Unable to cancel invite.",
    };
  }

  const managed = await ensureWorkOrderManager(
    parsed.data.spaceId,
    parsed.data.workOrderId,
  );

  if (!managed?.context) {
    return {
      error: managed?.error ?? "You cannot manage members in this work order.",
    };
  }

  const { context } = managed;
  const adminSupabase = createSupabaseAdminClient();
  const { data: invite, error } = await adminSupabase
    .from("invites")
    .update({
      status: "revoked",
    })
    .eq("id", parsed.data.inviteId)
    .eq("space_id", parsed.data.spaceId)
    .eq("status", "pending")
    .select("id, email")
    .single();

  if (error || !invite) {
    return {
      error: error?.message ?? "Unable to cancel invite.",
    };
  }

  await createActivityLog({
    supabase: context.supabase,
    action: "Cancelled a work order invite",
    actorUserId: context.user.id,
    spaceId: parsed.data.spaceId,
    workOrderId: parsed.data.workOrderId,
    entityType: "invite",
    entityId: invite.id,
    details: {
      summary: invite.email ?? "Invite",
    },
  });

  revalidatePath(getWorkOrderMembersPath(parsed.data.spaceId, parsed.data.workOrderId));

  return {
    success: "Invite cancelled.",
  };
}

export async function removeWorkOrderMember(formData: FormData) {
  const parsed = removeWorkOrderMemberSchema.safeParse({
    spaceId: readText(formData, "spaceId"),
    workOrderId: readText(formData, "workOrderId"),
    membershipId: readText(formData, "membershipId"),
  });

  if (!parsed.success) {
    return;
  }

  const context = await getWorkOrderActorContextForAction(
    parsed.data.spaceId,
    parsed.data.workOrderId,
  );

  if (!context || !context.permissions.canManageMembers) {
    return;
  }

  const { data: membership, error: membershipError } = await context.supabase
    .from("work_order_memberships")
    .select("id, user_id, role")
    .eq("id", parsed.data.membershipId)
    .eq("work_order_id", parsed.data.workOrderId)
    .maybeSingle();

  if (membershipError || !membership) {
    return;
  }

  const { data: profile, error: profileError } = await context.supabase
    .from("profiles")
    .select("full_name")
    .eq("id", membership.user_id)
    .maybeSingle();

  if (profileError) {
    return;
  }

  const { error } = await context.supabase
    .from("work_order_memberships")
    .delete()
    .eq("id", parsed.data.membershipId)
    .eq("work_order_id", parsed.data.workOrderId);

  if (error) {
    return;
  }

  await createActivityLog({
    supabase: context.supabase,
    action: "Removed a work order member",
    actorUserId: context.user.id,
    spaceId: parsed.data.spaceId,
    workOrderId: parsed.data.workOrderId,
    entityType: "work_order_membership",
    entityId: parsed.data.membershipId,
    details: {
      summary: profile?.full_name ?? "Member",
      before: formatRoleLabel(membership.role),
    },
  });

  revalidatePath(
    getWorkOrderMembersPath(parsed.data.spaceId, parsed.data.workOrderId),
  );
}

export async function updateWorkOrderMemberRole(
  previousState: WorkOrderMemberActionState = initialWorkOrderMemberActionState,
  formData: FormData,
): Promise<WorkOrderMemberActionState> {
  void previousState;
  const parsed = updateWorkOrderMemberRoleSchema.safeParse({
    spaceId: readText(formData, "spaceId"),
    workOrderId: readText(formData, "workOrderId"),
    membershipId: readText(formData, "membershipId"),
    memberUserId: readText(formData, "memberUserId"),
    role: readText(formData, "role"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Unable to change member role.",
    };
  }

  const context = await getWorkOrderActorContextForAction(
    parsed.data.spaceId,
    parsed.data.workOrderId,
  );

  if (!context) {
    return {
      error: "You do not have access to this work order.",
    };
  }

  if (!context.permissions.canManageMembers) {
    return {
      error:
        getLockedWorkOrderMessage(context.workOrder.status) ??
        "You cannot manage members in this work order.",
    };
  }

  if (context.spaceRole !== "admin") {
    return {
      error: "Only admins can change member roles.",
    };
  }

  const { data: membership, error: membershipError } = await context.supabase
    .from("work_order_memberships")
    .select("id, user_id, role")
    .eq("id", parsed.data.membershipId)
    .eq("work_order_id", parsed.data.workOrderId)
    .maybeSingle();

  if (membershipError) {
    return {
      error: membershipError.message,
    };
  }

  if (!membership) {
    return {
      error: "That member could not be found.",
    };
  }

  if (membership.user_id !== parsed.data.memberUserId) {
    return {
      error: "That member could not be verified.",
    };
  }

  if (membership.user_id === context.user.id) {
    return {
      error: "Admin access cannot be changed from the member list.",
    };
  }

  if (membership.role === "admin") {
    return {
      error: "Admin access is managed separately and cannot be changed here.",
    };
  }

  if (membership.role === parsed.data.role) {
    return {
      success: "Member role updated.",
    };
  }

  const { data: profile, error: profileError } = await context.supabase
    .from("profiles")
    .select("full_name")
    .eq("id", membership.user_id)
    .maybeSingle();

  if (profileError) {
    return {
      error: profileError.message,
    };
  }

  const { error: updateError } = await context.supabase
    .from("work_order_memberships")
    .update({
      role: parsed.data.role,
    })
    .eq("id", membership.id)
    .eq("work_order_id", parsed.data.workOrderId);

  if (updateError) {
    return {
      error: updateError.message,
    };
  }

  await createActivityLog({
    supabase: context.supabase,
    action: "Changed a work order member role",
    actorUserId: context.user.id,
    spaceId: parsed.data.spaceId,
    workOrderId: parsed.data.workOrderId,
    entityType: "work_order_membership",
    entityId: membership.id,
    details: {
      summary: profile?.full_name ?? "Member",
      before: formatRoleLabel(membership.role),
      after: formatRoleLabel(parsed.data.role),
    },
  });

  revalidatePath(
    getWorkOrderMembersPath(parsed.data.spaceId, parsed.data.workOrderId),
  );

  return {
    success: "Member role updated.",
  };
}
