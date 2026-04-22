import "server-only";

import { requireAuthenticatedAppUser } from "@/features/auth/api/profiles";
import { getWorkOrderActorContextForAction } from "@/features/work-orders/api/work-orders";
import type { WorkOrderStatus } from "@/types/database";

export type CompletedWorkOrderHistoryItem = Readonly<{
  id: string;
  completedAt: string;
  spaceNameSnapshot: string;
  workOrderTitleSnapshot: string;
  roleSnapshot: string;
  spaceId: string | null;
  workOrderId: string | null;
}>;

export type HistoryLiveWorkOrderPreview = Readonly<{
  title: string;
  subject: string | null;
  subjectType: string;
  description: string | null;
  locationLabel: string | null;
  unitLabel: string | null;
  status: WorkOrderStatus;
  priority: string;
  startDate: string | null;
  dueDate: string | null;
}>;

export type HistoryDetail = Readonly<{
  history: CompletedWorkOrderHistoryItem;
  liveWorkOrder: HistoryLiveWorkOrderPreview | null;
}>;

export async function getHistoryDetailForCurrentUser(
  historyId: string,
): Promise<HistoryDetail | null> {
  const { supabase, user } = await requireAuthenticatedAppUser();
  const { data: row, error } = await supabase
    .from("completed_work_order_history")
    .select(
      "id, completed_at, space_name_snapshot, work_order_title_snapshot, role_snapshot, space_id, work_order_id",
    )
    .eq("id", historyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!row) {
    return null;
  }

  const history: CompletedWorkOrderHistoryItem = {
    id: row.id,
    completedAt: row.completed_at,
    spaceNameSnapshot: row.space_name_snapshot,
    workOrderTitleSnapshot: row.work_order_title_snapshot,
    roleSnapshot: row.role_snapshot,
    spaceId: row.space_id,
    workOrderId: row.work_order_id,
  };

  let liveWorkOrder: HistoryLiveWorkOrderPreview | null = null;

  if (history.spaceId && history.workOrderId) {
    const context = await getWorkOrderActorContextForAction(
      history.spaceId,
      history.workOrderId,
    );

    if (context) {
      const wo = context.workOrder;
      liveWorkOrder = {
        title: wo.title,
        subject: wo.subject,
        subjectType: wo.subjectType,
        description: wo.description,
        locationLabel: wo.locationLabel,
        unitLabel: wo.unitLabel,
        status: wo.status,
        priority: wo.priority,
        startDate: wo.startDate,
        dueDate: wo.dueDate,
      };
    }
  }

  return { history, liveWorkOrder };
}

export async function getCompletedWorkOrderHistoryForCurrentUser(): Promise<
  CompletedWorkOrderHistoryItem[]
> {
  const { supabase, user } = await requireAuthenticatedAppUser();
  const { data, error } = await supabase
    .from("completed_work_order_history")
    .select(
      "id, completed_at, space_name_snapshot, work_order_title_snapshot, role_snapshot, space_id, work_order_id",
    )
    .eq("user_id", user.id)
    .order("completed_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    completedAt: row.completed_at,
    spaceNameSnapshot: row.space_name_snapshot,
    workOrderTitleSnapshot: row.work_order_title_snapshot,
    roleSnapshot: row.role_snapshot,
    spaceId: row.space_id,
    workOrderId: row.work_order_id,
  }));
}
