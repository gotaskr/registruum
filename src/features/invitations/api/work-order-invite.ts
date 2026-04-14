import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatDateTimeLabel } from "@/lib/utils";

export type WorkOrderInviteDetails = Readonly<{
  id: string;
  token: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  spaceId: string;
  spaceName: string;
  role: string;
  workOrderId: string | null;
  workOrderTitle: string | null;
  invitedByUserId: string;
  invitedByName: string;
  expiresAt: string;
}>;

export async function getWorkOrderInviteByToken(
  token: string,
): Promise<WorkOrderInviteDetails | null> {
  const adminSupabase = createSupabaseAdminClient();
  const { data: invite, error } = await adminSupabase
    .from("invites")
    .select("id, status, role, space_id, invited_by_user_id, assigned_work_order_ids, expires_at")
    .eq("token_hash", token)
    .eq("method", "link")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!invite) {
    return null;
  }

  const [spaceResult, inviterResult, workOrderResult] = await Promise.all([
    adminSupabase.from("spaces").select("id, name").eq("id", invite.space_id).maybeSingle(),
    adminSupabase
      .from("profiles")
      .select("full_name")
      .eq("id", invite.invited_by_user_id)
      .maybeSingle(),
    invite.assigned_work_order_ids.length > 0
      ? adminSupabase
          .from("work_orders")
          .select("id, title")
          .eq("id", invite.assigned_work_order_ids[0])
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (spaceResult.error) {
    throw new Error(spaceResult.error.message);
  }

  if (inviterResult.error) {
    throw new Error(inviterResult.error.message);
  }

  if (workOrderResult.error) {
    throw new Error(workOrderResult.error.message);
  }

  return {
    id: invite.id,
    token,
    status: invite.status,
    spaceId: invite.space_id,
    spaceName: spaceResult.data?.name ?? "Unknown Space",
    role: invite.role,
    workOrderId: workOrderResult.data?.id ?? invite.assigned_work_order_ids[0] ?? null,
    workOrderTitle: workOrderResult.data?.title ?? null,
    invitedByUserId: invite.invited_by_user_id,
    invitedByName: inviterResult.data?.full_name ?? "Unknown User",
    expiresAt: formatDateTimeLabel(invite.expires_at),
  };
}
