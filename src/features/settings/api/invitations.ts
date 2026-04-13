import "server-only";

import type { User } from "@supabase/supabase-js";
import {
  requireAuthenticatedAppUser,
} from "@/features/auth/api/profiles";
import type { SettingsInvitation } from "@/features/settings/types/invitation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDateTimeLabel } from "@/lib/utils";
import type { Database } from "@/types/database";
import type { Profile } from "@/types/profile";

type ServerSupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

type InviteRow = Database["public"]["Tables"]["invites"]["Row"];
type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name"
>;
type SpaceRow = Pick<Database["public"]["Tables"]["spaces"]["Row"], "id" | "name">;
type WorkOrderRow = Pick<Database["public"]["Tables"]["work_orders"]["Row"], "id" | "title">;

type PendingInvitationsContext = Readonly<{
  supabase: ServerSupabaseClient;
  user: User;
  profile: Profile;
}>;

export async function listPendingInvitationsForUser(
  ctx: PendingInvitationsContext,
): Promise<SettingsInvitation[]> {
  const { supabase, user, profile } = ctx;

  const inviteQuery = profile.email
    ? supabase
        .from("invites")
        .select("*")
        .eq("status", "pending")
        .or(`target_user_id.eq.${user.id},email.eq.${profile.email}`)
        .order("created_at", { ascending: false })
    : supabase
        .from("invites")
        .select("*")
        .eq("status", "pending")
        .eq("target_user_id", user.id)
        .order("created_at", { ascending: false });

  const { data, error } = await inviteQuery;

  if (error) {
    throw new Error(error.message);
  }

  const invites = (data ?? []) as InviteRow[];

  if (invites.length === 0) {
    return [];
  }

  const inviterIds = [...new Set(invites.map((invite) => invite.invited_by_user_id))];
  const spaceIds = [...new Set(invites.map((invite) => invite.space_id))];
  const workOrderIds = [
    ...new Set(invites.flatMap((invite) => invite.assigned_work_order_ids ?? [])),
  ];

  const [profilesResult, spacesResult, workOrdersResult] = await Promise.all([
    supabase.from("profiles").select("id, full_name").in("id", inviterIds),
    supabase.from("spaces").select("id, name").in("id", spaceIds),
    workOrderIds.length > 0
      ? supabase.from("work_orders").select("id, title").in("id", workOrderIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (profilesResult.error) {
    throw new Error(profilesResult.error.message);
  }

  if (spacesResult.error) {
    throw new Error(spacesResult.error.message);
  }

  if (workOrdersResult.error) {
    throw new Error(workOrdersResult.error.message);
  }

  const profiles = (profilesResult.data ?? []) as ProfileRow[];
  const spaces = (spacesResult.data ?? []) as SpaceRow[];
  const workOrders = (workOrdersResult.data ?? []) as WorkOrderRow[];

  const inviterById = new Map(profiles.map((row) => [row.id, row.full_name]));
  const spaceById = new Map(spaces.map((row) => [row.id, row.name]));
  const workOrderById = new Map(workOrders.map((row) => [row.id, row.title]));

  return invites.map((invite) => ({
    id: invite.id,
    spaceName: spaceById.get(invite.space_id) ?? "Unknown Space",
    role: invite.role,
    method: invite.method,
    invitedByName: inviterById.get(invite.invited_by_user_id) ?? "Unknown User",
    createdAt: formatDateTimeLabel(invite.created_at),
    expiresAt: formatDateTimeLabel(invite.expires_at),
    message: invite.message,
    workOrderTitles: (invite.assigned_work_order_ids ?? [])
      .map((workOrderId) => workOrderById.get(workOrderId))
      .filter((title): title is string => Boolean(title)),
  }));
}

export async function getSettingsInvitations(): Promise<SettingsInvitation[]> {
  const ctx = await requireAuthenticatedAppUser();
  return listPendingInvitationsForUser(ctx);
}
