import "server-only";

import { requireAuthenticatedAppUser } from "@/features/auth/api/profiles";
import { sumPlanStorageBytesForUser } from "@/features/settings/lib/plan-storage-usage";
import { getSpacesForUser } from "@/features/spaces/api/spaces";

export type StorageSpaceUsage = Readonly<{
  spaceId: string;
  spaceName: string;
  usedBytes: number;
  usedLabel: string;
  percentOfTotal: number;
}>;

export type StorageSnapshot = Readonly<{
  totalUsedBytes: number;
  totalUsedLabel: string;
  spaceCount: number;
  spaces: StorageSpaceUsage[];
}>;

function formatBytes(value: number) {
  const gb = 1024 * 1024 * 1024;
  const mb = 1024 * 1024;

  if (value >= gb) {
    return `${Math.round((value / gb) * 10) / 10} GB`;
  }

  return `${Math.round((value / mb) * 10) / 10} MB`;
}

export async function getStorageSnapshotForCurrentUser(): Promise<StorageSnapshot> {
  const authenticated = await requireAuthenticatedAppUser();
  const spaces = await getSpacesForUser(authenticated);

  if (spaces.length === 0) {
    return {
      totalUsedBytes: 0,
      totalUsedLabel: "0 MB",
      spaceCount: 0,
      spaces: [],
    };
  }

  const spaceIds = spaces.map((space) => space.id);
  const { data: documents, error } = await authenticated.supabase
    .from("documents")
    .select("space_id, file_size_bytes")
    .in("space_id", spaceIds);

  if (error) {
    throw new Error(error.message);
  }

  const bytesBySpaceId = new Map(spaceIds.map((spaceId) => [spaceId, 0]));

  for (const row of documents ?? []) {
    const current = bytesBySpaceId.get(row.space_id) ?? 0;
    bytesBySpaceId.set(row.space_id, current + Math.max(0, row.file_size_bytes ?? 0));
  }

  const totalUsedBytes = [...bytesBySpaceId.values()].reduce((sum, value) => sum + value, 0);
  const spacesByUsage = spaces
    .map((space) => {
      const usedBytes = bytesBySpaceId.get(space.id) ?? 0;
      return {
        spaceId: space.id,
        spaceName: space.name,
        usedBytes,
        usedLabel: formatBytes(usedBytes),
        percentOfTotal: totalUsedBytes > 0 ? Math.round((usedBytes / totalUsedBytes) * 100) : 0,
      };
    })
    .sort((a, b) => b.usedBytes - a.usedBytes);

  return {
    totalUsedBytes,
    totalUsedLabel: formatBytes(totalUsedBytes),
    spaceCount: spaces.length,
    spaces: spacesByUsage,
  };
}

/** Total plan storage for the current user (see `sumPlanStorageBytesForUser`). */
export async function getOwnedSpacesDocumentStorageBytes(): Promise<number> {
  const { user } = await requireAuthenticatedAppUser();
  return sumPlanStorageBytesForUser(user.id);
}

export type WorkOrderStorageBreakdownRow = Readonly<{
  workOrderId: string | null;
  title: string;
  spaceId: string;
  spaceName: string;
  usedBytes: number;
}>;

const WORK_ORDER_IN_CHUNK = 120;

/**
 * Document bytes in spaces you created (archived and active), grouped by work order (largest first).
 * Rows with `workOrderId: null` are documents not linked to a work order.
 */
export async function getOwnedSpacesWorkOrderStorageBreakdown(): Promise<
  WorkOrderStorageBreakdownRow[]
> {
  const { supabase, user } = await requireAuthenticatedAppUser();
  const { data: ownedSpaces, error: spacesError } = await supabase
    .from("spaces")
    .select("id, name")
    .eq("created_by_user_id", user.id);

  if (spacesError) {
    throw new Error(spacesError.message);
  }

  const spaceRows = ownedSpaces ?? [];
  if (spaceRows.length === 0) {
    return [];
  }

  const spaceIds = spaceRows.map((s) => s.id);
  const spaceNameById = new Map(spaceRows.map((s) => [s.id, s.name] as const));

  const { data: documents, error: documentsError } = await supabase
    .from("documents")
    .select("work_order_id, file_size_bytes, space_id")
    .in("space_id", spaceIds);

  if (documentsError) {
    throw new Error(documentsError.message);
  }

  type Agg = { bytes: number; spaceId: string };
  const byWorkOrderId = new Map<string, Agg>();
  let unassignedBytes = 0;
  const unassignedSpaceIds = new Set<string>();

  for (const row of documents ?? []) {
    const bytes = Math.max(0, row.file_size_bytes ?? 0);
    if (bytes === 0) {
      continue;
    }
    if (!row.work_order_id) {
      unassignedBytes += bytes;
      unassignedSpaceIds.add(row.space_id);
      continue;
    }
    const prev = byWorkOrderId.get(row.work_order_id);
    if (prev) {
      prev.bytes += bytes;
    } else {
      byWorkOrderId.set(row.work_order_id, { bytes, spaceId: row.space_id });
    }
  }

  const workOrderMetaById = new Map<string, { title: string; spaceId: string }>();
  const workOrderIds = [...byWorkOrderId.keys()];

  for (let i = 0; i < workOrderIds.length; i += WORK_ORDER_IN_CHUNK) {
    const chunk = workOrderIds.slice(i, i + WORK_ORDER_IN_CHUNK);
    const { data: workOrders, error: woError } = await supabase
      .from("work_orders")
      .select("id, title, space_id")
      .in("id", chunk);

    if (woError) {
      throw new Error(woError.message);
    }

    for (const wo of workOrders ?? []) {
      workOrderMetaById.set(wo.id, { title: wo.title, spaceId: wo.space_id });
    }
  }

  const rows: WorkOrderStorageBreakdownRow[] = [];

  for (const [workOrderId, agg] of byWorkOrderId) {
    const meta = workOrderMetaById.get(workOrderId);
    const spaceId = meta?.spaceId ?? agg.spaceId;
    rows.push({
      workOrderId,
      title: meta?.title ?? "Unknown work order",
      spaceId,
      spaceName: spaceNameById.get(spaceId) ?? "Space",
      usedBytes: agg.bytes,
    });
  }

  if (unassignedBytes > 0) {
    const [firstUnassignedSpaceId] = [...unassignedSpaceIds];
    const spaceName =
      unassignedSpaceIds.size === 1 && firstUnassignedSpaceId
        ? (spaceNameById.get(firstUnassignedSpaceId) ?? "Space")
        : "Across owned spaces";

    rows.push({
      workOrderId: null,
      title: "Not assigned to a work order",
      spaceId: firstUnassignedSpaceId ?? spaceIds[0],
      spaceName,
      usedBytes: unassignedBytes,
    });
  }

  rows.sort((a, b) => b.usedBytes - a.usedBytes);
  return rows;
}
