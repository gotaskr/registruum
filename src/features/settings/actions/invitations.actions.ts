"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedAppUser } from "@/features/auth/api/profiles";
import { createActivityLog } from "@/features/logs/api/activity-logs";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isMissingSpaceMembershipStatusColumn } from "@/lib/supabase/schema-compat";
import type { Database } from "@/types/database";
import { isSpaceTeamRole } from "@/features/permissions/lib/roles";
import { syncSpaceTeamMembershipAcrossExistingWorkOrders } from "@/features/work-orders/lib/space-team-memberships";
import {
  initialInvitationActionState,
  type InvitationActionState,
} from "@/features/settings/types/invitation-action-state";

type InviteRow = Database["public"]["Tables"]["invites"]["Row"];
type SpaceMembershipRow = Database["public"]["Tables"]["space_memberships"]["Row"];

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function getPendingInviteForCurrentUser(inviteId: string) {
  const { supabase, user, profile } = await requireAuthenticatedAppUser();
  const { data, error } = await supabase
    .from("invites")
    .select("*")
    .eq("id", inviteId)
    .eq("status", "pending")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const invite = data as InviteRow | null;

  if (!invite) {
    throw new Error("Invitation not found.");
  }

  const matchesUser =
    invite.target_user_id === user.id ||
    (!!profile.email && invite.email?.toLowerCase() === profile.email.toLowerCase());

  if (!matchesUser) {
    throw new Error("You do not have access to that invitation.");
  }

  return { supabase, user, profile, invite };
}

async function ensureActiveSpaceMembership(input: {
  supabase: ReturnType<typeof createSupabaseAdminClient>;
  spaceId: string;
  userId: string;
  invitedByUserId: string;
  role: SpaceMembershipRow["role"];
}) {
  const { supabase, spaceId, userId, invitedByUserId, role } = input;

  let membershipQuery = await supabase
    .from("space_memberships")
    .select("id, status, role")
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

  const membership = membershipQuery.data;

  if (!membership) {
    const { error } = await supabase.from("space_memberships").insert({
      space_id: spaceId,
      user_id: userId,
      invited_by_user_id: invitedByUserId,
      role,
      status: "active",
    });

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  if ("status" in membership && membership.status === "removed") {
    const { error } = await supabase
      .from("space_memberships")
      .update({
        invited_by_user_id: invitedByUserId,
        role,
        status: "active",
        removed_at: null,
        removed_by_user_id: null,
      })
      .eq("id", membership.id);

    if (error) {
      throw new Error(error.message);
    }
    return;
  }

  if (!isSpaceTeamRole(membership.role) && isSpaceTeamRole(role)) {
    const { error } = await supabase
      .from("space_memberships")
      .update({
        invited_by_user_id: invitedByUserId,
        role,
      })
      .eq("id", membership.id);

    if (error) {
      throw new Error(error.message);
    }
  }
}

export async function acceptInvitation(
  previousState: InvitationActionState = initialInvitationActionState,
  formData: FormData,
): Promise<InvitationActionState> {
  void previousState;
  const inviteId = readText(formData, "inviteId");

  if (!inviteId) {
    return { error: "Invitation not found." };
  }

  try {
    const { supabase, user, profile, invite } = await getPendingInviteForCurrentUser(inviteId);
    const adminSupabase = createSupabaseAdminClient();
    await ensureActiveSpaceMembership({
      supabase: adminSupabase,
      spaceId: invite.space_id,
      userId: user.id,
      invitedByUserId: invite.invited_by_user_id,
      role: invite.role,
    });

    const assignedWorkOrderIds = invite.assigned_work_order_ids ?? [];

    if (assignedWorkOrderIds.length === 0 && isSpaceTeamRole(invite.role)) {
      await syncSpaceTeamMembershipAcrossExistingWorkOrders({
        supabase: adminSupabase,
        spaceId: invite.space_id,
        userId: user.id,
        role: invite.role,
        assignedByUserId: invite.invited_by_user_id,
      });
    }

    if (assignedWorkOrderIds.length > 0) {
      const { data: existingRows, error: existingError } = await adminSupabase
        .from("work_order_memberships")
        .select("work_order_id")
        .eq("user_id", user.id)
        .in("work_order_id", assignedWorkOrderIds);

      if (existingError) {
        throw new Error(existingError.message);
      }

      const existingWorkOrderIds = new Set(
        (existingRows ?? []).map((row) => row.work_order_id),
      );
      const missingWorkOrderIds = assignedWorkOrderIds.filter(
        (workOrderId) => !existingWorkOrderIds.has(workOrderId),
      );

      if (missingWorkOrderIds.length > 0) {
        const { error: insertError } = await adminSupabase.from("work_order_memberships").insert(
          missingWorkOrderIds.map((workOrderId) => ({
            work_order_id: workOrderId,
            user_id: user.id,
            role: invite.role,
            assigned_by_user_id: invite.invited_by_user_id,
          })),
        );

        if (insertError) {
          throw new Error(insertError.message);
        }
      }

      for (const workOrderId of assignedWorkOrderIds) {
        await createActivityLog({
          supabase,
          action: "Accepted a work order invite",
          actorUserId: user.id,
          spaceId: invite.space_id,
          workOrderId,
          entityType: "invite",
          entityId: invite.id,
          details: {
            summary: profile.fullName,
          },
        });
      }
    }

    const { data: acceptedInvite, error: updateError } = await adminSupabase
      .from("invites")
      .update({
        status: "accepted",
        accepted_by_user_id: user.id,
        accepted_at: new Date().toISOString(),
        target_user_id: user.id,
      })
      .eq("id", invite.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (updateError) {
      throw new Error(updateError.message);
    }

    if (!acceptedInvite) {
      throw new Error("Invitation could not be marked as accepted.");
    }

    revalidatePath("/settings");
    revalidatePath("/");
    revalidatePath(`/space/${invite.space_id}`);
    revalidatePath(`/space/${invite.space_id}/team`);
    for (const workOrderId of invite.assigned_work_order_ids ?? []) {
      revalidatePath(`/space/${invite.space_id}/work-order/${workOrderId}/members`);
    }

    return { success: "Invitation accepted." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to accept invitation.",
    };
  }
}

export async function declineInvitation(
  previousState: InvitationActionState = initialInvitationActionState,
  formData: FormData,
): Promise<InvitationActionState> {
  void previousState;
  const inviteId = readText(formData, "inviteId");

  if (!inviteId) {
    return { error: "Invitation not found." };
  }

  try {
    const { supabase, user, profile, invite } = await getPendingInviteForCurrentUser(inviteId);
    const adminSupabase = createSupabaseAdminClient();

    const { data: revokedInvite, error: updateError } = await adminSupabase
      .from("invites")
      .update({
        status: "revoked",
      })
      .eq("id", invite.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (updateError) {
      throw new Error(updateError.message);
    }

    if (!revokedInvite) {
      throw new Error("Invitation could not be declined.");
    }

    for (const workOrderId of invite.assigned_work_order_ids ?? []) {
      await createActivityLog({
        supabase,
        action: "Declined a work order invite",
        actorUserId: user.id,
        spaceId: invite.space_id,
        workOrderId,
        entityType: "invite",
        entityId: invite.id,
        details: {
          summary: profile.fullName,
        },
      });

      revalidatePath(`/space/${invite.space_id}/work-order/${workOrderId}/members`);
    }

    revalidatePath("/settings");
    return { success: "Invitation declined." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to decline invitation.",
    };
  }
}
