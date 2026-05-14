import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_MODULE } from "@/lib/constants";
import type { PlanStorageBreakdownItem } from "@/features/settings/types/plan-storage-breakdown";

const DOCUMENT_WORK_ORDER_IN_CHUNK = 200;

function formatBytesLabel(value: number): string {
  const gb = 1024 * 1024 * 1024;
  const mb = 1024 * 1024;

  if (value >= gb) {
    return `${Math.round((value / gb) * 10) / 10} GB`;
  }

  return `${Math.round((value / mb) * 10) / 10} MB`;
}

async function aggregateDocumentBytesByWorkOrderInSpace(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  spaceId: string,
): Promise<Map<string | null, number>> {
  const byWo = new Map<string | null, number>();
  const { data: documents, error } = await admin
    .from("documents")
    .select("work_order_id, file_size_bytes")
    .eq("space_id", spaceId);

  if (error) {
    throw new Error(error.message);
  }

  for (const row of documents ?? []) {
    const add = Math.max(0, row.file_size_bytes ?? 0);
    if (add === 0) {
      continue;
    }
    const key = row.work_order_id ?? null;
    byWo.set(key, (byWo.get(key) ?? 0) + add);
  }

  return byWo;
}

async function aggregateDocumentBytesByWorkOrderIdExcludingSpaces(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  workOrderIds: string[],
  excludeSpaceIds: Set<string>,
): Promise<Map<string, number>> {
  const byWo = new Map<string, number>();
  if (workOrderIds.length === 0) {
    return byWo;
  }

  for (let i = 0; i < workOrderIds.length; i += DOCUMENT_WORK_ORDER_IN_CHUNK) {
    const chunk = workOrderIds.slice(i, i + DOCUMENT_WORK_ORDER_IN_CHUNK);
    const { data: documents, error } = await admin
      .from("documents")
      .select("work_order_id, file_size_bytes, space_id")
      .in("work_order_id", chunk);

    if (error) {
      throw new Error(error.message);
    }

    for (const row of documents ?? []) {
      if (!row.work_order_id || !row.space_id || excludeSpaceIds.has(row.space_id)) {
        continue;
      }
      const add = Math.max(0, row.file_size_bytes ?? 0);
      if (add === 0) {
        continue;
      }
      byWo.set(row.work_order_id, (byWo.get(row.work_order_id) ?? 0) + add);
    }
  }

  return byWo;
}

async function sumDocumentBytesInSpaces(admin: ReturnType<typeof createSupabaseAdminClient>, spaceIds: string[]) {
  if (spaceIds.length === 0) {
    return 0;
  }

  let total = 0;
  for (let i = 0; i < spaceIds.length; i += DOCUMENT_WORK_ORDER_IN_CHUNK) {
    const chunk = spaceIds.slice(i, i + DOCUMENT_WORK_ORDER_IN_CHUNK);
    const { data: documents, error } = await admin
      .from("documents")
      .select("file_size_bytes")
      .in("space_id", chunk);

    if (error) {
      throw new Error(error.message);
    }

    total += (documents ?? []).reduce((sum, row) => sum + Math.max(0, row.file_size_bytes ?? 0), 0);
  }

  return total;
}

async function sumDocumentBytesForWorkOrdersExcludingSpaces(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  workOrderIds: string[],
  excludeSpaceIds: string[],
) {
  if (workOrderIds.length === 0) {
    return 0;
  }

  const exclude = new Set(excludeSpaceIds);
  let total = 0;

  for (let i = 0; i < workOrderIds.length; i += DOCUMENT_WORK_ORDER_IN_CHUNK) {
    const chunk = workOrderIds.slice(i, i + DOCUMENT_WORK_ORDER_IN_CHUNK);
    const { data: documents, error } = await admin
      .from("documents")
      .select("file_size_bytes, space_id")
      .in("work_order_id", chunk);

    if (error) {
      throw new Error(error.message);
    }

    for (const row of documents ?? []) {
      if (!row.space_id || exclude.has(row.space_id)) {
        continue;
      }
      total += Math.max(0, row.file_size_bytes ?? 0);
    }
  }

  return total;
}

/**
 * Plan storage for a user:
 * - All documents (including archived) in spaces they **created** (workspace owner bucket).
 * - Plus documents on work orders they are a **member** of in **other people's** spaces
 *   (participant bucket — avoids double-counting files already in their owned spaces).
 *
 * `completed_work_order_history` rows are metadata only (no file blobs); WO documents carry the bytes.
 */
export async function sumPlanStorageBytesForUser(userId: string): Promise<number> {
  const admin = createSupabaseAdminClient();

  const { data: ownedSpaces, error: ownedError } = await admin
    .from("spaces")
    .select("id")
    .eq("created_by_user_id", userId);

  if (ownedError) {
    throw new Error(ownedError.message);
  }

  const ownedSpaceIds = (ownedSpaces ?? []).map((row) => row.id);
  const ownedPart = await sumDocumentBytesInSpaces(admin, ownedSpaceIds);

  const { data: memberships, error: membershipError } = await admin
    .from("work_order_memberships")
    .select("work_order_id")
    .eq("user_id", userId);

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  const workOrderIds = [
    ...new Set(
      (memberships ?? [])
        .map((row) => row.work_order_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ];

  const participantPart = await sumDocumentBytesForWorkOrdersExcludingSpaces(
    admin,
    workOrderIds,
    ownedSpaceIds,
  );

  return ownedPart + participantPart;
}

/**
 * Spaces you own (per work order + “other” files in that space) and work orders you join elsewhere,
 * sorted by bytes descending. Matches `sumPlanStorageBytesForUser` attribution.
 */
export async function getPlanStorageBreakdownForUser(userId: string): Promise<PlanStorageBreakdownItem[]> {
  const admin = createSupabaseAdminClient();

  const { data: ownedSpaceRows, error: ownedError } = await admin
    .from("spaces")
    .select("id, name")
    .eq("created_by_user_id", userId)
    .order("name", { ascending: true });

  if (ownedError) {
    throw new Error(ownedError.message);
  }

  const ownedSpaces = ownedSpaceRows ?? [];
  const ownedSpaceIds = ownedSpaces.map((row) => row.id);
  const ownedSpaceIdSet = new Set(ownedSpaceIds);

  const items: PlanStorageBreakdownItem[] = [];

  type OwnedWoEntry = Readonly<{ spaceId: string; spaceName: string; workOrderId: string; usedBytes: number }>;
  const ownedWoEntries: OwnedWoEntry[] = [];
  const ownedUnassigned: { spaceId: string; spaceName: string; usedBytes: number }[] = [];

  for (const space of ownedSpaces) {
    const spaceName = space.name?.trim() || "Space";
    const bytesByWo = await aggregateDocumentBytesByWorkOrderInSpace(admin, space.id);

    for (const [woId, usedBytes] of bytesByWo) {
      if (usedBytes <= 0) {
        continue;
      }

      if (woId == null) {
        ownedUnassigned.push({ spaceId: space.id, spaceName, usedBytes });
        continue;
      }

      ownedWoEntries.push({
        spaceId: space.id,
        spaceName,
        workOrderId: woId,
        usedBytes,
      });
    }
  }

  const ownedWoIds = [...new Set(ownedWoEntries.map((e) => e.workOrderId))];
  const woTitleById = new Map<string, string>();

  for (let i = 0; i < ownedWoIds.length; i += DOCUMENT_WORK_ORDER_IN_CHUNK) {
    const chunk = ownedWoIds.slice(i, i + DOCUMENT_WORK_ORDER_IN_CHUNK);
    const { data: woRows, error: woErr } = await admin.from("work_orders").select("id, title").in("id", chunk);

    if (woErr) {
      throw new Error(woErr.message);
    }

    for (const row of woRows ?? []) {
      woTitleById.set(row.id, row.title?.trim() || "Work order");
    }
  }

  for (const entry of ownedWoEntries) {
    const title = woTitleById.get(entry.workOrderId) ?? "Work order";
    items.push({
      kind: "work_order",
      id: entry.workOrderId,
      primaryLabel: title,
      secondaryLabel: `Work order · ${entry.spaceName}`,
      usedBytes: entry.usedBytes,
      usedLabel: formatBytesLabel(entry.usedBytes),
      href: `/space/${entry.spaceId}/work-order/${entry.workOrderId}/${DEFAULT_MODULE}`,
    });
  }

  for (const u of ownedUnassigned) {
    items.push({
      kind: "unassigned",
      id: `${u.spaceId}:unassigned`,
      primaryLabel: "Other documents",
      secondaryLabel: `No work order · ${u.spaceName}`,
      usedBytes: u.usedBytes,
      usedLabel: formatBytesLabel(u.usedBytes),
      href: `/space/${u.spaceId}`,
    });
  }

  const { data: memberships, error: membershipError } = await admin
    .from("work_order_memberships")
    .select("work_order_id")
    .eq("user_id", userId);

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  const membershipWoIds = [
    ...new Set(
      (memberships ?? [])
        .map((row) => row.work_order_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ];

  if (membershipWoIds.length === 0) {
    return items.sort((a, b) => b.usedBytes - a.usedBytes);
  }

  const workOrderMetaById = new Map<string, { title: string; spaceId: string }>();

  for (let i = 0; i < membershipWoIds.length; i += DOCUMENT_WORK_ORDER_IN_CHUNK) {
    const chunk = membershipWoIds.slice(i, i + DOCUMENT_WORK_ORDER_IN_CHUNK);
    const { data: workOrders, error: woError } = await admin
      .from("work_orders")
      .select("id, title, space_id")
      .in("id", chunk);

    if (woError) {
      throw new Error(woError.message);
    }

    for (const wo of workOrders ?? []) {
      if (wo.space_id && !ownedSpaceIdSet.has(wo.space_id)) {
        workOrderMetaById.set(wo.id, { title: wo.title?.trim() || "Work order", spaceId: wo.space_id });
      }
    }
  }

  const participantWoIds = [...workOrderMetaById.keys()];
  if (participantWoIds.length === 0) {
    return items.sort((a, b) => b.usedBytes - a.usedBytes);
  }

  const bytesByWoId = await aggregateDocumentBytesByWorkOrderIdExcludingSpaces(
    admin,
    participantWoIds,
    ownedSpaceIdSet,
  );

  const spaceIdsForNames = [
    ...new Set(participantWoIds.map((woId) => workOrderMetaById.get(woId)?.spaceId).filter(Boolean) as string[]),
  ];
  const spaceNameById = new Map<string, string>();

  for (let i = 0; i < spaceIdsForNames.length; i += DOCUMENT_WORK_ORDER_IN_CHUNK) {
    const chunk = spaceIdsForNames.slice(i, i + DOCUMENT_WORK_ORDER_IN_CHUNK);
    const { data: spaceRows, error: snError } = await admin.from("spaces").select("id, name").in("id", chunk);

    if (snError) {
      throw new Error(snError.message);
    }

    for (const row of spaceRows ?? []) {
      spaceNameById.set(row.id, row.name?.trim() || "Space");
    }
  }

  for (const woId of participantWoIds) {
    const usedBytes = bytesByWoId.get(woId) ?? 0;
    if (usedBytes <= 0) {
      continue;
    }

    const meta = workOrderMetaById.get(woId);
    if (!meta) {
      continue;
    }

    const spaceName = spaceNameById.get(meta.spaceId) ?? "Space";

    items.push({
      kind: "work_order",
      id: woId,
      primaryLabel: meta.title,
      secondaryLabel: `Work order · ${spaceName}`,
      usedBytes,
      usedLabel: formatBytesLabel(usedBytes),
      href: `/space/${meta.spaceId}/work-order/${woId}/${DEFAULT_MODULE}`,
    });
  }

  return items.sort((a, b) => b.usedBytes - a.usedBytes);
}
