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

/**
 * Plan storage for a user: all documents (including archived) in spaces **they created** only.
 * Files uploaded by invited collaborators in those spaces count here (they bill the owner).
 * Work-order files in **someone else’s** space do **not** count toward this user’s plan — they count
 * toward that space creator’s plan. `completed_work_order_history` is metadata only (no file blobs).
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
  return sumDocumentBytesInSpaces(admin, ownedSpaceIds);
}

/**
 * Spaces you own (per work order + “other” files in that space), sorted by bytes descending.
 * Matches `sumPlanStorageBytesForUser` attribution.
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

  return items.sort((a, b) => b.usedBytes - a.usedBytes);
}
