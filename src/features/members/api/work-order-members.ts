import "server-only";

import { profileAvatarBucket } from "@/features/settings/lib/profile-avatar-storage";
import { getWorkOrderActorContext } from "@/features/work-orders/api/work-orders";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatDateTimeLabel, getInitials } from "@/lib/utils";
import type { Database } from "@/types/database";
import type {
  WorkOrderMember,
  WorkOrderPendingInvite,
} from "@/features/members/types/work-order-member";

type WorkOrderMembershipRow =
  Database["public"]["Tables"]["work_order_memberships"]["Row"];
type InviteRow = Database["public"]["Tables"]["invites"]["Row"];
type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name" | "email" | "avatar_path"
>;

type WorkOrderMembersResult = Readonly<{
  members: WorkOrderMember[];
  pendingInvites: WorkOrderPendingInvite[];
}>;

export async function getWorkOrderMembers(
  spaceId: string,
  workOrderId: string,
): Promise<WorkOrderMembersResult> {
  const context = await getWorkOrderActorContext(spaceId, workOrderId);
  const [membershipResult, inviteResult] = await Promise.all([
    context.supabase
      .from("work_order_memberships")
      .select("*")
      .eq("work_order_id", workOrderId)
      .order("created_at", { ascending: true }),
    context.permissions.canManageMembers
      ? context.supabase
          .from("invites")
          .select("*")
          .eq("space_id", spaceId)
          .eq("status", "pending")
          .contains("assigned_work_order_ids", [workOrderId])
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  const { data: membershipRows, error: membershipError } = membershipResult;

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  if (inviteResult.error) {
    throw new Error(inviteResult.error.message);
  }

  const rows = (membershipRows ?? []) as WorkOrderMembershipRow[];
  const inviteRows = (inviteResult.data ?? []) as InviteRow[];
  const adminSupabase = createSupabaseAdminClient();
  const profileIds = [
    ...new Set([
      ...rows.map((row) => row.user_id),
      ...inviteRows
        .map((row) => row.invited_by_user_id)
        .filter((value): value is string => value !== null),
    ]),
  ];

  const { data: profileRows, error: profileError } = await adminSupabase
    .from("profiles")
    .select("id, full_name, email, avatar_path")
    .in("id", profileIds.length > 0 ? profileIds : ["00000000-0000-0000-0000-000000000000"]);

  if (profileError) {
    throw new Error(profileError.message);
  }

  const profiles = (profileRows ?? []) as ProfileRow[];
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const avatarUrlByUserId = new Map<string, string | null>();

  await Promise.all(
    profiles.map(async (profile) => {
      if (!profile.avatar_path) {
        avatarUrlByUserId.set(profile.id, null);
        return;
      }

      const { data } = await adminSupabase.storage
        .from(profileAvatarBucket)
        .createSignedUrl(profile.avatar_path, 60 * 60);

      avatarUrlByUserId.set(profile.id, data?.signedUrl ?? null);
    }),
  );

  return {
    members: rows.map((row) => {
      const profile = profileById.get(row.user_id);
      const name = profile?.full_name ?? "Unknown User";

      return {
        id: row.id,
        userId: row.user_id,
        workOrderId: row.work_order_id,
        name,
        email: profile?.email ?? "unknown@registruum.app",
        role: row.role,
        initials: getInitials(name),
        avatarUrl: avatarUrlByUserId.get(row.user_id) ?? null,
        assignedAt: formatDateTimeLabel(row.created_at),
      };
    }),
    pendingInvites: inviteRows.map((invite) => ({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      createdAt: formatDateTimeLabel(invite.created_at),
      expiresAt: formatDateTimeLabel(invite.expires_at),
      invitedByName: profileById.get(invite.invited_by_user_id)?.full_name ?? "Unknown User",
      message: invite.message,
    })),
  };
}
