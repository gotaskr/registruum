import "server-only";

import { requireAuthenticatedAppUser } from "@/features/auth/api/profiles";
import { getWorkOrderModuleHref } from "@/lib/route-utils";
import { formatDateTimeLabel } from "@/lib/utils";
import type { Database } from "@/types/database";
import type { JobMarketDashboardData } from "@/features/job-market/types/job-market";

type JobMarketPostRow = Database["public"]["Tables"]["job_market_posts"]["Row"];
type SpaceNameRow = Pick<Database["public"]["Tables"]["spaces"]["Row"], "id" | "name">;
type WorkOrderMarketRow = Pick<
  Database["public"]["Tables"]["work_orders"]["Row"],
  "id" | "status" | "priority" | "location_label"
>;

export async function getJobMarketDashboardData(): Promise<JobMarketDashboardData> {
  const { supabase } = await requireAuthenticatedAppUser();
  const { data: postRows, error: postError } = await supabase
    .from("job_market_posts")
    .select("*")
    .order("posted_at", { ascending: false });

  if (postError) {
    throw new Error(postError.message);
  }

  const rows = (postRows ?? []) as JobMarketPostRow[];

  if (rows.length === 0) {
    return {
      totalPosts: 0,
      activePosts: 0,
      closedPosts: 0,
      spacesWithPosts: 0,
      posts: [],
    };
  }

  const spaceIds = [...new Set(rows.map((row) => row.space_id))];
  const workOrderIds = [...new Set(rows.map((row) => row.work_order_id))];
  const [{ data: spaceRows, error: spaceError }, { data: workOrderRows, error: workOrderError }] =
    await Promise.all([
      supabase.from("spaces").select("id, name").in("id", spaceIds),
      supabase
        .from("work_orders")
        .select("id, status, priority, location_label")
        .in("id", workOrderIds),
    ]);

  if (spaceError) {
    throw new Error(spaceError.message);
  }

  if (workOrderError) {
    throw new Error(workOrderError.message);
  }

  const spaceNameById = new Map(
    ((spaceRows ?? []) as SpaceNameRow[]).map((space) => [space.id, space.name] as const),
  );
  const workOrderById = new Map(
    ((workOrderRows ?? []) as WorkOrderMarketRow[]).map((workOrder) => [
      workOrder.id,
      workOrder,
    ] as const),
  );

  const posts = rows.map((row) => {
    const workOrder = workOrderById.get(row.work_order_id);

    return {
      id: row.id,
      workOrderId: row.work_order_id,
      spaceId: row.space_id,
      title: row.title_snapshot,
      description: row.description_snapshot,
      locationLabel: workOrder?.location_label ?? row.location_label,
      postedAt: row.posted_at,
      postedAtLabel: formatDateTimeLabel(row.posted_at),
      status: row.status,
      spaceName: spaceNameById.get(row.space_id) ?? "Unknown Space",
      workOrderStatus: workOrder?.status ?? "open",
      priority: workOrder?.priority ?? "medium",
      openHref: getWorkOrderModuleHref(row.space_id, row.work_order_id, "overview"),
    };
  });

  return {
    totalPosts: rows.length,
    activePosts: rows.filter((row) => row.status === "active").length,
    closedPosts: rows.filter((row) => row.status !== "active").length,
    spacesWithPosts: new Set(rows.map((row) => row.space_id)).size,
    posts,
  };
}
