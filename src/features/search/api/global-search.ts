import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Profile } from "@/types/profile";
import type {
  GlobalSearchArchiveHit,
  GlobalSearchResponse,
  GlobalSearchSpaceHit,
  GlobalSearchWorkOrderHit,
} from "@/features/search/types/global-search";
import { getSpacesForUser } from "@/features/spaces/api/spaces";
import { DEFAULT_MODULE } from "@/lib/constants";
import {
  getArchiveRecordHref,
  getSpaceEntryHref,
  getWorkOrderModuleHref,
} from "@/lib/route-utils";
import type { Database } from "@/types/database";

type AppSupabase = SupabaseClient<Database>;

export type GlobalSearchSession = Readonly<{
  supabase: AppSupabase;
  user: User;
  profile: Profile;
}>;

type WorkOrderSearchRow = Pick<
  Database["public"]["Tables"]["work_orders"]["Row"],
  "id" | "title" | "space_id" | "subject" | "description"
>;
type ArchivedSearchRow = Pick<
  Database["public"]["Tables"]["archived_work_orders"]["Row"],
  "id" | "title_snapshot" | "space_id"
>;

export function parseGlobalSearchQuery(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.length < 2 || trimmed.length > 80) {
    return null;
  }

  return trimmed;
}

/** Escape `%`, `_`, and `\` for use inside a Postgres ILIKE pattern (with surrounding `%`). */
function escapeIlikeFragment(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

function buildIlikePattern(normalized: string): string {
  return `%${escapeIlikeFragment(normalized)}%`;
}

async function collectWorkOrderHits(
  supabase: AppSupabase,
  spaceIds: string[],
  pattern: string,
  spaceNameById: Map<string, string>,
  limit: number,
): Promise<GlobalSearchWorkOrderHit[]> {
  if (spaceIds.length === 0) {
    return [];
  }

  const fields = ["title", "subject", "description"] as const;
  const byId = new Map<string, WorkOrderSearchRow>();

  await Promise.all(
    fields.map(async (column) => {
      const { data, error } = await supabase
        .from("work_orders")
        .select("id, title, space_id, subject, description")
        .in("space_id", spaceIds)
        .neq("status", "archived")
        .ilike(column, pattern)
        .order("updated_at", { ascending: false })
        .limit(12);

      if (error) {
        return;
      }

      for (const row of (data ?? []) as WorkOrderSearchRow[]) {
        byId.set(row.id, row);
      }
    }),
  );

  return [...byId.values()]
    .slice(0, limit)
    .map((row) => ({
      id: row.id,
      title: row.title,
      spaceId: row.space_id,
      spaceName: spaceNameById.get(row.space_id) ?? "Space",
      href: getWorkOrderModuleHref(row.space_id, row.id, DEFAULT_MODULE),
    }));
}

async function collectArchiveHits(
  supabase: AppSupabase,
  spaceIds: string[],
  pattern: string,
  spaceNameById: Map<string, string>,
  limit: number,
): Promise<GlobalSearchArchiveHit[]> {
  if (spaceIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("archived_work_orders")
    .select("id, title_snapshot, space_id")
    .in("space_id", spaceIds)
    .ilike("title_snapshot", pattern)
    .order("archived_at", { ascending: false })
    .limit(limit);

  if (error) {
    return [];
  }

  return ((data ?? []) as ArchivedSearchRow[]).map((row) => ({
    id: row.id,
    title: row.title_snapshot,
    spaceId: row.space_id,
    spaceName: spaceNameById.get(row.space_id) ?? "Space",
    href: getArchiveRecordHref(row.id),
  }));
}

export async function globalSearchForSession(
  session: GlobalSearchSession,
  normalizedQuery: string,
): Promise<GlobalSearchResponse> {
  const spaces = await getSpacesForUser(session);
  const pattern = buildIlikePattern(normalizedQuery);

  if (spaces.length === 0) {
    return { spaces: [], workOrders: [], archive: [] };
  }

  const spaceIds = spaces.map((space) => space.id);
  const spaceNameById = new Map(spaces.map((space) => [space.id, space.name] as const));

  const lower = normalizedQuery.toLowerCase();
  const spaceHits: GlobalSearchSpaceHit[] = [];

  for (const space of spaces) {
    if (space.name.toLowerCase().includes(lower)) {
      spaceHits.push({
        id: space.id,
        name: space.name,
        href: getSpaceEntryHref(space),
      });
    }
  }

  const [workOrders, archive] = await Promise.all([
    collectWorkOrderHits(session.supabase, spaceIds, pattern, spaceNameById, 15),
    collectArchiveHits(session.supabase, spaceIds, pattern, spaceNameById, 10),
  ]);

  return {
    spaces: spaceHits.slice(0, 10),
    workOrders,
    archive,
  };
}
