"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAuthenticatedAppUser } from "@/features/auth/api/profiles";
import { createActivityLog } from "@/features/logs/api/activity-logs";
import {
  initialInvitationActionState,
  type InvitationActionState,
} from "@/features/settings/types/invitation-action-state";
import { DEFAULT_MODULE } from "@/lib/constants";
import type { Database } from "@/types/database";

type InviteRow = Database["public"]["Tables"]["invites"]["Row"];

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function getPendingLinkInvite(token: string) {
  const adminSupabase = createSupabaseAdminClient();
  const { data, error } = await adminSupabase
    .from("invites")
    .select("*")
    .eq("token_hash", token)
    .eq("method", "link")
    .eq("status", "pending")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const invite = data as InviteRow | null;

  if (!invite) {
    throw new Error("Invitation not found.");
  }

  return {
    adminSupabase,
    invite,
  };
}

export async function acceptWorkOrderInviteLink(
  previousState: InvitationActionState = initialInvitationActionState,
  formData: FormData,
): Promise<InvitationActionState> {
  void previousState;
  const token = readText(formData, "token");
  let redirectPath: string | null = null;

  if (!token) {
    return { error: "Invitation not found." };
  }

  try {
    const { user, profile } = await requireAuthenticatedAppUser();
    const { adminSupabase, invite } = await getPendingLinkInvite(token);
    const workOrderId = invite.assigned_work_order_ids[0];

    if (!workOrderId) {
      throw new Error("This invitation is not linked to a work order.");
    }

    const { data: existingSpaceMembership, error: membershipError } = await adminSupabase
      .from("space_memberships")
      .select("id, status")
      .eq("space_id", invite.space_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      throw new Error(membershipError.message);
    }

    if (!existingSpaceMembership) {
      const { error } = await adminSupabase.from("space_memberships").insert({
        space_id: invite.space_id,
        user_id: user.id,
        invited_by_user_id: invite.invited_by_user_id,
        role: "member",
        status: "active",
      });

      if (error) {
        throw new Error(error.message);
      }
    } else if (existingSpaceMembership.status === "removed") {
      const { error } = await adminSupabase
        .from("space_memberships")
        .update({
          invited_by_user_id: invite.invited_by_user_id,
          role: "member",
          status: "active",
          removed_at: null,
          removed_by_user_id: null,
        })
        .eq("id", existingSpaceMembership.id);

      if (error) {
        throw new Error(error.message);
      }
    }

    const { data: existingMembership, error: existingWorkOrderMembershipError } =
      await adminSupabase
        .from("work_order_memberships")
        .select("id")
        .eq("work_order_id", workOrderId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (existingWorkOrderMembershipError) {
      throw new Error(existingWorkOrderMembershipError.message);
    }

    if (!existingMembership) {
      const { error } = await adminSupabase.from("work_order_memberships").insert({
        work_order_id: workOrderId,
        user_id: user.id,
        role: "member",
        assigned_by_user_id: invite.invited_by_user_id,
      });

      if (error) {
        throw new Error(error.message);
      }
    }

    const { error: inviteUpdateError } = await adminSupabase
      .from("invites")
      .update({
        status: "accepted",
        accepted_by_user_id: user.id,
        accepted_at: new Date().toISOString(),
        target_user_id: user.id,
      })
      .eq("id", invite.id)
      .eq("status", "pending");

    if (inviteUpdateError) {
      throw new Error(inviteUpdateError.message);
    }

    await createActivityLog({
      supabase: adminSupabase,
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

    revalidatePath(`/space/${invite.space_id}/work-order/${workOrderId}/members`);
    redirectPath = `/space/${invite.space_id}/work-order/${workOrderId}/${DEFAULT_MODULE}`;
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to accept invitation.",
    };
  }

  if (redirectPath) {
    redirect(redirectPath);
  }

  return {};
}

export async function declineWorkOrderInviteLink(
  previousState: InvitationActionState = initialInvitationActionState,
  formData: FormData,
): Promise<InvitationActionState> {
  void previousState;
  const token = readText(formData, "token");

  if (!token) {
    return { error: "Invitation not found." };
  }

  try {
    const { adminSupabase, invite } = await getPendingLinkInvite(token);
    const workOrderId = invite.assigned_work_order_ids[0] ?? null;

    const { error } = await adminSupabase
      .from("invites")
      .update({
        status: "revoked",
      })
      .eq("id", invite.id)
      .eq("status", "pending");

    if (error) {
      throw new Error(error.message);
    }

    await createActivityLog({
      supabase: adminSupabase,
      action: "Declined a work order invite",
      actorUserId: null,
      spaceId: invite.space_id,
      workOrderId,
      entityType: "invite",
      entityId: invite.id,
      details: {
        summary: "Invite link",
      },
    });

    revalidatePath(`/invite/${token}`);
    return {
      success: "Invitation declined.",
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to decline invitation.",
    };
  }
}
