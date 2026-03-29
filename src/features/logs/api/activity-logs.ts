import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { parseLogDetails } from "@/features/logs/lib/log-details";
import { getWorkOrderActorContext } from "@/features/work-orders/api/work-orders";
import { formatDateTimeLabel } from "@/lib/utils";
import type { Database } from "@/types/database";
import type { LogEntry } from "@/types/log";

type ActivityLogRow = Database["public"]["Tables"]["activity_logs"]["Row"];
type ActivityLogInsert = Database["public"]["Tables"]["activity_logs"]["Insert"];
type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name"
>;

type ServerSupabaseClient = SupabaseClient<Database>;

export type CreateActivityLogInput = Readonly<{
  supabase: ServerSupabaseClient;
  action: string;
  actorUserId: string | null;
  spaceId: string;
  workOrderId: string | null;
  entityType: ActivityLogInsert["entity_type"];
  entityId: string | null;
  details?: ActivityLogInsert["details"];
}>;

function mapLogRow(
  row: ActivityLogRow,
  profileById: Map<string, ProfileRow>,
): LogEntry {
  const details = parseLogDetails(row.details);
  const actorName = row.actor_user_id
    ? (profileById.get(row.actor_user_id)?.full_name ?? "Unknown User")
    : "System";

  return {
    id: row.id,
    workOrderId: row.work_order_id ?? "",
    actorUserId: row.actor_user_id,
    actorName,
    action: row.action,
    createdAt: formatDateTimeLabel(row.created_at),
    rawCreatedAt: row.created_at,
    details: details.summary,
    change:
      details.before || details.after
        ? {
            before: details.before,
            after: details.after,
          }
        : undefined,
  };
}

export async function createActivityLog({
  supabase,
  action,
  actorUserId,
  spaceId,
  workOrderId,
  entityType,
  entityId,
  details = {},
}: CreateActivityLogInput) {
  const { error } = await supabase.from("activity_logs").insert({
    action,
    actor_user_id: actorUserId,
    space_id: spaceId,
    work_order_id: workOrderId,
    entity_type: entityType,
    entity_id: entityId,
    details,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function getWorkOrderLogs(spaceId: string, workOrderId: string) {
  const context = await getWorkOrderActorContext(spaceId, workOrderId);

  if (!context.permissions.canViewLogs) {
    return [];
  }

  const { data: logRows, error: logError } = await context.supabase
    .from("activity_logs")
    .select("*")
    .eq("space_id", spaceId)
    .eq("work_order_id", workOrderId)
    .order("created_at", { ascending: false });

  if (logError) {
    throw new Error(logError.message);
  }

  const rows = (logRows ?? []) as ActivityLogRow[];
  const actorIds = [
    ...new Set(
      rows
        .map((row) => row.actor_user_id)
        .filter((value): value is string => value !== null),
    ),
  ];

  if (actorIds.length === 0) {
    return rows.map((row) => mapLogRow(row, new Map()));
  }

  const { data: profileRows, error: profileError } = await context.supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", actorIds);

  if (profileError) {
    throw new Error(profileError.message);
  }

  const profiles = (profileRows ?? []) as ProfileRow[];
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

  return rows.map((row) => mapLogRow(row, profileById));
}
