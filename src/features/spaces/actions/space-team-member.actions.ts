"use server";

import { revalidatePath } from "next/cache";
import { createActivityLog } from "@/features/logs/api/activity-logs";
import {
  canChangeSpaceTeamRole,
  canRemoveSpaceTeamMember,
  getAssignableSpaceTeamRoles,
  isSpaceTeamRole,
} from "@/features/permissions/lib/roles";
import { requireAuthenticatedAppUser } from "@/features/auth/api/profiles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isMissingSpaceMembershipStatusColumn } from "@/lib/supabase/schema-compat";
import { formatRoleLabel } from "@/lib/utils";
import { updateSpaceMemberRoleSchema, removeSpaceMemberSchema } from "@/features/members/schemas/space-members.schema";
import {
  removeInheritedSpaceTeamMembershipsFromExistingWorkOrders,
  syncSpaceTeamMembershipAcrossExistingWorkOrders,
} from "@/features/work-orders/lib/space-team-memberships";
import type { Database } from "@/types/database";

type SpaceMembershipRow = Database["public"]["Tables"]["space_memberships"]["Row"];

export type SpaceTeamMemberActionState = Readonly<{
  error?: string;
  success?: string;
}>;

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function getActiveSpaceMembership(spaceId: string, userId: string) {
  const { supabase } = await requireAuthenticatedAppUser();
  let query = await supabase
    .from("space_memberships")
    .select("*")
    .eq("space_id", spaceId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (isMissingSpaceMembershipStatusColumn(query.error)) {
    query = await supabase
      .from("space_memberships")
      .select("*")
      .eq("space_id", spaceId)
      .eq("user_id", userId)
      .maybeSingle();
  }

  if (query.error) {
    throw new Error(query.error.message);
  }

  return (query.data as SpaceMembershipRow | null) ?? null;
}

async function ensureTeamManager(spaceId: string) {
  const authenticated = await requireAuthenticatedAppUser();
  const actorMembership = await getActiveSpaceMembership(spaceId, authenticated.user.id);

  if (!actorMembership || !isSpaceTeamRole(actorMembership.role)) {
    throw new Error("You do not have access to this space team.");
  }

  return {
    supabase: authenticated.supabase,
    user: authenticated.user,
    profile: authenticated.profile,
    actorMembership,
  };
}

async function getTargetTeamMembership(spaceId: string, membershipId: string) {
  const adminSupabase = createSupabaseAdminClient();
  const { data, error } = await adminSupabase
    .from("space_memberships")
    .select("*")
    .eq("space_id", spaceId)
    .eq("id", membershipId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const membership = (data as SpaceMembershipRow | null) ?? null;

  if (!membership || membership.status === "removed" || !isSpaceTeamRole(membership.role)) {
    throw new Error("That space team member could not be found.");
  }

  return {
    adminSupabase,
    membership,
  };
}

export async function updateSpaceTeamMemberRole(
  previousState: SpaceTeamMemberActionState = {},
  formData: FormData,
): Promise<SpaceTeamMemberActionState> {
  void previousState;

  const parsed = updateSpaceMemberRoleSchema.safeParse({
    spaceId: readText(formData, "spaceId"),
    membershipId: readText(formData, "membershipId"),
    role: readText(formData, "role"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Unable to update team role.",
    };
  }

  try {
    const { supabase, user, actorMembership } = await ensureTeamManager(parsed.data.spaceId);
    const { adminSupabase, membership } = await getTargetTeamMembership(
      parsed.data.spaceId,
      parsed.data.membershipId,
    );

    if (membership.user_id === user.id) {
      return {
        error: "Your own team role cannot be changed here.",
      };
    }

    if (!canChangeSpaceTeamRole(actorMembership.role, membership.role)) {
      return {
        error: "You do not have permission to change this team role.",
      };
    }

    const allowedRoles = getAssignableSpaceTeamRoles(
      actorMembership.role,
    ) as readonly SpaceMembershipRow["role"][];

    if (!allowedRoles.includes(parsed.data.role)) {
      return {
        error: "You do not have permission to assign that team role.",
      };
    }

    if (membership.role === parsed.data.role) {
      return {
        success: "Team role updated.",
      };
    }

    const { data: targetProfile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", membership.user_id)
      .maybeSingle();

    if (profileError) {
      throw new Error(profileError.message);
    }

    const { error: updateError } = await adminSupabase
      .from("space_memberships")
      .update({
        role: parsed.data.role,
      })
      .eq("id", membership.id)
      .eq("space_id", parsed.data.spaceId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await syncSpaceTeamMembershipAcrossExistingWorkOrders({
      supabase: adminSupabase,
      spaceId: parsed.data.spaceId,
      userId: membership.user_id,
      role: parsed.data.role,
      assignedByUserId: user.id,
    });

    await createActivityLog({
      supabase: adminSupabase,
      action: "Changed a space team role",
      actorUserId: user.id,
      spaceId: parsed.data.spaceId,
      workOrderId: null,
      entityType: "space_membership",
      entityId: membership.id,
      details: {
        summary: targetProfile?.full_name ?? "Team member",
        before: formatRoleLabel(membership.role),
        after: formatRoleLabel(parsed.data.role),
      },
    });

    revalidatePath(`/space/${parsed.data.spaceId}/team`);
    revalidatePath(`/space/${parsed.data.spaceId}`);

    return {
      success: `${targetProfile?.full_name ?? "Team member"} is now ${formatRoleLabel(parsed.data.role)}.`,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to update team role.",
    };
  }
}

export async function removeSpaceTeamMember(
  previousState: SpaceTeamMemberActionState = {},
  formData: FormData,
): Promise<SpaceTeamMemberActionState> {
  void previousState;

  const parsed = removeSpaceMemberSchema.safeParse({
    spaceId: readText(formData, "spaceId"),
    membershipId: readText(formData, "membershipId"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Unable to remove team member.",
    };
  }

  try {
    const { supabase, user, actorMembership } = await ensureTeamManager(parsed.data.spaceId);
    const { adminSupabase, membership } = await getTargetTeamMembership(
      parsed.data.spaceId,
      parsed.data.membershipId,
    );

    if (membership.user_id === user.id) {
      return {
        error: "Your own team membership cannot be removed here.",
      };
    }

    if (!canRemoveSpaceTeamMember(actorMembership.role, membership.role)) {
      return {
        error: "You do not have permission to remove this team member.",
      };
    }

    const { data: targetProfile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", membership.user_id)
      .maybeSingle();

    if (profileError) {
      throw new Error(profileError.message);
    }

    const { error: updateError } = await adminSupabase
      .from("space_memberships")
      .update({
        status: "removed",
        removed_by_user_id: user.id,
        removed_at: new Date().toISOString(),
      })
      .eq("id", membership.id)
      .eq("space_id", parsed.data.spaceId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await removeInheritedSpaceTeamMembershipsFromExistingWorkOrders({
      supabase: adminSupabase,
      spaceId: parsed.data.spaceId,
      userId: membership.user_id,
    });

    await createActivityLog({
      supabase: adminSupabase,
      action: "Removed a space team member",
      actorUserId: user.id,
      spaceId: parsed.data.spaceId,
      workOrderId: null,
      entityType: "space_membership",
      entityId: membership.id,
      details: {
        summary: targetProfile?.full_name ?? "Team member",
        before: formatRoleLabel(membership.role),
        after: "Removed",
      },
    });

    revalidatePath(`/space/${parsed.data.spaceId}/team`);
    revalidatePath(`/space/${parsed.data.spaceId}`);
    revalidatePath("/");

    return {
      success: `${targetProfile?.full_name ?? "Team member"} removed from the space team.`,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to remove team member.",
    };
  }
}
