import { formatDateTimeLabel } from "@/lib/utils";
import type { Database } from "@/types/database";
import type { LogEntry } from "@/types/log";
import { parseLogDetails } from "@/features/logs/lib/log-details";

type ActivityLogRow = Database["public"]["Tables"]["activity_logs"]["Row"];

export type ActivityLogProfile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name"
>;

export function mapActivityLogRow(
  row: ActivityLogRow,
  profileById: ReadonlyMap<string, ActivityLogProfile>,
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
