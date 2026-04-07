"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedAppUser } from "@/features/auth/api/profiles";
import {
  canCreateSpaceTeamInvites,
  getDefaultSpaceTeamInviteRole,
  isSpaceTeamRole,
} from "@/features/permissions/lib/roles";
import { getSpaceByIdForUser } from "@/features/spaces/api/spaces";
import {
  initialInvitationActionState,
  type InvitationActionState,
} from "@/features/settings/types/invitation-action-state";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ProfileLookupResult = Readonly<{
  id: string;
  full_name: string;
  email: string | null;
  user_tag: string;
}>;

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function buildInviteToken() {
  return crypto.randomUUID().replace(/-/g, "");
}

function normalizeUserTag(value: string) {
  const trimmed = value.trim().toUpperCase();
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

async function ensureSpaceInviteManager(spaceId: string) {
  const { supabase, user } = await requireAuthenticatedAppUser();
  const space = await getSpaceByIdForUser(spaceId);

  if (!canCreateSpaceTeamInvites(space.membershipRole)) {
    throw new Error("You do not have permission to invite space team members.");
  }

  return {
    supabase,
    user,
    space,
  };
}

async function findProfileByUserTag(input: {
  supabase: Awaited<ReturnType<typeof requireAuthenticatedAppUser>>["supabase"];
  userTag: string;
}) {
  const normalizedTag = normalizeUserTag(input.userTag);
  const { data, error } = await input.supabase.rpc("find_profile_by_user_tag", {
    input_user_tag: normalizedTag,
  });

  if (error) {
    throw new Error(error.message);
  }

  const profile = ((data ?? []) as ProfileLookupResult[])[0] ?? null;

  return {
    normalizedTag,
    profile,
  };
}

async function revokeExistingPendingCodeInvites(input: {
  adminSupabase: ReturnType<typeof createSupabaseAdminClient>;
  spaceId: string;
  targetUserId: string;
}) {
  const { error } = await input.adminSupabase
    .from("invites")
    .update({
      status: "revoked",
    })
    .eq("space_id", input.spaceId)
    .eq("status", "pending")
    .eq("method", "code")
    .eq("target_user_id", input.targetUserId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function createSpaceTeamInviteLink(
  previousState: InvitationActionState = initialInvitationActionState,
  formData: FormData,
): Promise<InvitationActionState> {
  void previousState;
  const spaceId = readText(formData, "spaceId");

  if (!spaceId) {
    return {
      error: "Space not found.",
    };
  }

  try {
    const { user, space } = await ensureSpaceInviteManager(spaceId);
    const adminSupabase = createSupabaseAdminClient();
    const token = buildInviteToken();

    const { error } = await adminSupabase.from("invites").insert({
      space_id: space.id,
      invited_by_user_id: user.id,
      email: null,
      role: getDefaultSpaceTeamInviteRole(),
      token_hash: token,
      status: "pending",
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
      method: "link",
      message: null,
      assigned_work_order_ids: [],
      target_user_id: null,
      invite_code: null,
    });

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath(`/space/${space.id}/team`);

    return {
      success: "Invite link created.",
      inviteLink: `/invite/${token}`,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to create invite link.",
    };
  }
}

export async function createSpaceTeamInviteByUserTag(
  previousState: InvitationActionState = initialInvitationActionState,
  formData: FormData,
): Promise<InvitationActionState> {
  void previousState;
  const spaceId = readText(formData, "spaceId");
  const userTag = readText(formData, "userTag");

  if (!spaceId) {
    return {
      error: "Space not found.",
    };
  }

  try {
    const { supabase, user, space } = await ensureSpaceInviteManager(spaceId);
    const adminSupabase = createSupabaseAdminClient();
    const { normalizedTag, profile } = await findProfileByUserTag({
      supabase,
      userTag,
    });

    if (!profile) {
      return {
        error: "No user was found for that user tag.",
      };
    }

    if (profile.id === user.id) {
      return {
        error: "You cannot invite yourself to the team.",
      };
    }

    const { data: existingMembership, error: membershipError } = await adminSupabase
      .from("space_memberships")
      .select("id, status, role")
      .eq("space_id", space.id)
      .eq("user_id", profile.id)
      .maybeSingle();

    if (membershipError) {
      throw new Error(membershipError.message);
    }

    if (
      existingMembership &&
      existingMembership.status !== "removed" &&
      isSpaceTeamRole(existingMembership.role)
    ) {
      return {
        error: `${profile.full_name} is already part of this space team.`,
      };
    }

    await revokeExistingPendingCodeInvites({
      adminSupabase,
      spaceId: space.id,
      targetUserId: profile.id,
    });

    const { error } = await adminSupabase.from("invites").insert({
      space_id: space.id,
      invited_by_user_id: user.id,
      email: profile.email,
      role: getDefaultSpaceTeamInviteRole(),
      token_hash: buildInviteToken(),
      status: "pending",
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
      method: "code",
      message: null,
      assigned_work_order_ids: [],
      target_user_id: profile.id,
      invite_code: null,
    });

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath(`/space/${space.id}/team`);
    revalidatePath("/settings");

    return {
      success: `Invitation sent to ${normalizedTag}. They will appear in Invitations right away.`,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to send team invite.",
    };
  }
}
