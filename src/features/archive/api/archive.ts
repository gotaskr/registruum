import "server-only";

import { requireAuthenticatedAppUser } from "@/features/auth/api/profiles";
import { getWorkOrderMessages } from "@/features/chat/api/messages";
import { getWorkOrderDocuments } from "@/features/documents/api/documents";
import { getWorkOrderLogs } from "@/features/logs/api/activity-logs";
import { getWorkOrderMembers } from "@/features/members/api/work-order-members";
import { getSpacesForUser } from "@/features/spaces/api/spaces";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getArchiveRecordHref } from "@/lib/route-utils";
import { isMissingArchiveTableError } from "@/lib/supabase/schema-compat";
import { formatDateTimeLabel } from "@/lib/utils";
import type {
  ArchiveFolder,
  ArchiveFolderOption,
  ArchiveSpaceFilterOption,
  ArchivedWorkOrderDetails,
  ArchivePageData,
  ArchiveSortOption,
  ArchivedWorkOrderItem,
} from "@/features/archive/types/archive";
import { getWorkOrderById, getWorkOrderOverviewData } from "@/features/work-orders/api/work-orders";
import type { Database } from "@/types/database";

type ArchiveFolderRow = Database["public"]["Tables"]["archive_folders"]["Row"];
type ArchivedWorkOrderRow = Database["public"]["Tables"]["archived_work_orders"]["Row"];
type ProfileNameRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name"
>;
type SpaceNameRow = Pick<
  Database["public"]["Tables"]["spaces"]["Row"],
  "id" | "name"
>;

type GetArchivePageDataInput = Readonly<{
  folderId?: string | null;
  spaceId?: string | null;
  query?: string | null;
  sort?: string | null;
}>;

type ArchiveFolderOptionsResult = Readonly<{
  defaultFolderId: string;
  folders: ArchiveFolderOption[];
}>;

function isArchiveUnavailableError(error: unknown) {
  if (typeof error === "object" && error !== null && "message" in error) {
    const message =
      typeof (error as { message?: unknown }).message === "string"
        ? (error as { message: string }).message.toLowerCase()
        : "";

    return (
      message.includes("missing required environment variable: supabase_service_role_key") ||
      message.includes("archive_folders") ||
      message.includes("archived_work_orders") ||
      message.includes("archive_activity_logs")
    );
  }

  return false;
}

function getArchiveUnavailableFolderOptions(): ArchiveFolderOptionsResult {
  return {
    defaultFolderId: "",
    folders: [],
  };
}

function normalizeArchiveSort(value?: string | null): ArchiveSortOption {
  switch (value) {
    case "archived_asc":
    case "title_asc":
    case "title_desc":
      return value;
    default:
      return "archived_desc";
  }
}

function mapArchiveFolder(
  row: ArchiveFolderRow,
  archivedCount: number,
): ArchiveFolder {
  return {
    id: row.id,
    name: row.name,
    parentId: row.parent_id,
    isSystemDefault: row.is_system_default,
    archivedCount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapArchiveFolderOption(row: ArchiveFolderRow): ArchiveFolderOption {
  return {
    id: row.id,
    name: row.name,
    isSystemDefault: row.is_system_default,
  };
}

async function ensureDefaultArchiveFolder() {
  try {
    const adminSupabase = createSupabaseAdminClient();
    const { data: existingFolder, error: existingFolderError } = await adminSupabase
      .from("archive_folders")
      .select("*")
      .eq("is_system_default", true)
      .maybeSingle();

    if (existingFolderError) {
      if (isMissingArchiveTableError(existingFolderError)) {
        return null;
      }

      throw new Error(existingFolderError.message);
    }

    if (existingFolder) {
      return existingFolder as ArchiveFolderRow;
    }

    const { data: createdFolder, error: createdFolderError } = await adminSupabase
      .from("archive_folders")
      .insert({
        name: "Unsorted Archive",
        is_system_default: true,
        created_by_user_id: null,
      })
      .select("*")
      .single();

    if (createdFolderError) {
      if (isMissingArchiveTableError(createdFolderError)) {
        return null;
      }

      throw new Error(createdFolderError.message);
    }

    return createdFolder as ArchiveFolderRow;
  } catch (error) {
    if (isArchiveUnavailableError(error)) {
      return null;
    }

    throw error;
  }
}

export async function getArchiveFolderOptions() {
  try {
    const { supabase } = await requireAuthenticatedAppUser();
    const defaultFolder = await ensureDefaultArchiveFolder();

    if (!defaultFolder) {
      return getArchiveUnavailableFolderOptions();
    }

    const { data, error } = await supabase
      .from("archive_folders")
      .select("*")
      .order("is_system_default", { ascending: false })
      .order("name", { ascending: true });

    if (error) {
      if (isMissingArchiveTableError(error)) {
        return getArchiveUnavailableFolderOptions();
      }

      throw new Error(error.message);
    }

    const folderRows = (data ?? []) as ArchiveFolderRow[];

    return {
      defaultFolderId: defaultFolder.id,
      folders: folderRows.map(mapArchiveFolderOption),
    };
  } catch (error) {
    if (isArchiveUnavailableError(error)) {
      return getArchiveUnavailableFolderOptions();
    }

    throw error;
  }
}

function sortArchivedItems(items: ArchivedWorkOrderItem[], sort: ArchiveSortOption) {
  return [...items].sort((left, right) => {
    switch (sort) {
      case "archived_asc":
        return left.archivedAt.localeCompare(right.archivedAt);
      case "title_asc":
        return left.title.localeCompare(right.title);
      case "title_desc":
        return right.title.localeCompare(left.title);
      case "archived_desc":
      default:
        return right.archivedAt.localeCompare(left.archivedAt);
    }
  });
}

export async function getArchivePageData({
  folderId,
  spaceId,
  query,
  sort,
}: GetArchivePageDataInput = {}): Promise<ArchivePageData> {
  const { supabase } = await requireAuthenticatedAppUser();
  const spaces = await getSpacesForUser();
  const defaultFolder = await ensureDefaultArchiveFolder();
  const rawQuery = query?.trim() ?? "";
  const normalizedQuery = rawQuery.toLowerCase();
  const normalizedSort = normalizeArchiveSort(sort);
  const accessibleSpaceIds = spaces.map((space) => space.id);
  const spaceOptions: ArchiveSpaceFilterOption[] = spaces.map((space) => ({
    id: space.id,
    name: space.name,
  }));
  const selectedSpaceId =
    spaceId && accessibleSpaceIds.includes(spaceId) ? spaceId : null;

  if (!defaultFolder) {
    return {
      folders: [],
      folderOptions: [],
      spaceOptions,
      selectedFolderId: folderId ?? null,
      selectedSpaceId,
      defaultFolderId: "",
      searchQuery: rawQuery,
      sort: normalizedSort,
      items: [],
      totalCount: 0,
    };
  }

  const { data: folderData, error: folderError } = await supabase
    .from("archive_folders")
    .select("*")
    .order("is_system_default", { ascending: false })
    .order("name", { ascending: true });

  if (folderError) {
    if (isMissingArchiveTableError(folderError)) {
      return {
        folders: [],
        folderOptions: [],
        spaceOptions,
        selectedFolderId: folderId ?? null,
        selectedSpaceId,
        defaultFolderId: "",
        searchQuery: rawQuery,
        sort: normalizedSort,
        items: [],
        totalCount: 0,
      };
    }

    throw new Error(folderError.message);
  }

  const folderRows = (folderData ?? []) as ArchiveFolderRow[];

  if (accessibleSpaceIds.length === 0) {
    return {
      folders: folderRows.map((row) => mapArchiveFolder(row, 0)),
      folderOptions: folderRows.map(mapArchiveFolderOption),
      spaceOptions,
      selectedFolderId: folderId ?? null,
      selectedSpaceId,
      defaultFolderId: defaultFolder.id,
      searchQuery: rawQuery,
      sort: normalizedSort,
      items: [],
      totalCount: 0,
    };
  }

  const selectedFolderId = folderId ?? null;

  const { data: archivedData, error: archivedError } = await supabase
    .from("archived_work_orders")
    .select("*")
    .in("space_id", accessibleSpaceIds);

  if (archivedError) {
    if (isMissingArchiveTableError(archivedError)) {
      return {
        folders: folderRows.map((row) => mapArchiveFolder(row, 0)),
        folderOptions: folderRows.map(mapArchiveFolderOption),
        spaceOptions,
        selectedFolderId,
        selectedSpaceId,
        defaultFolderId: defaultFolder.id,
        searchQuery: rawQuery,
        sort: normalizedSort,
        items: [],
        totalCount: 0,
      };
    }

    throw new Error(archivedError.message);
  }

  const archivedRows = (archivedData ?? []) as ArchivedWorkOrderRow[];
  const actorIds = [
    ...new Set(
      archivedRows
        .map((row) => row.archived_by_user_id)
        .filter((value): value is string => Boolean(value)),
    ),
  ];

  const profileById = new Map<string, ProfileNameRow>();

  if (actorIds.length > 0) {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", actorIds);

    if (profileError) {
      throw new Error(profileError.message);
    }

    for (const profile of (profileData ?? []) as ProfileNameRow[]) {
      profileById.set(profile.id, profile);
    }
  }

  const { data: spaceData, error: spaceError } = await supabase
    .from("spaces")
    .select("id, name")
    .in("id", accessibleSpaceIds);

  if (spaceError) {
    throw new Error(spaceError.message);
  }

  const spaceById = new Map(
    ((spaceData ?? []) as SpaceNameRow[]).map((space) => [space.id, space]),
  );
  const archivedCountByFolderId = new Map<string, number>();

  for (const row of archivedRows) {
    archivedCountByFolderId.set(
      row.archive_folder_id,
      (archivedCountByFolderId.get(row.archive_folder_id) ?? 0) + 1,
    );
  }

  const mappedItems = archivedRows
    .filter((row) => (selectedFolderId ? row.archive_folder_id === selectedFolderId : true))
    .filter((row) => (selectedSpaceId ? row.space_id === selectedSpaceId : true))
    .filter((row) =>
      normalizedQuery.length > 0
        ? row.title_snapshot.toLowerCase().includes(normalizedQuery)
        : true,
    )
    .map((row): ArchivedWorkOrderItem => ({
      id: row.id,
      originalWorkOrderId: row.original_work_order_id,
      title: row.title_snapshot,
      spaceId: row.space_id,
      spaceName: spaceById.get(row.space_id)?.name ?? "Unknown Space",
      folderId: row.archive_folder_id,
      folderName:
        folderRows.find((folder) => folder.id === row.archive_folder_id)?.name ??
        defaultFolder.name,
      archivedByUserId: row.archived_by_user_id,
      archivedByName: row.archived_by_user_id
        ? (profileById.get(row.archived_by_user_id)?.full_name ?? "Unknown User")
        : "System",
      archivedAt: row.archived_at,
      archivedAtLabel: formatDateTimeLabel(row.archived_at),
      viewHref: getArchiveRecordHref(row.id),
    }));

  return {
    folders: folderRows.map((row) =>
      mapArchiveFolder(row, archivedCountByFolderId.get(row.id) ?? 0),
    ),
    folderOptions: folderRows.map(mapArchiveFolderOption),
    spaceOptions,
    selectedFolderId,
    selectedSpaceId,
    defaultFolderId: defaultFolder.id,
    searchQuery: rawQuery,
    sort: normalizedSort,
    items: sortArchivedItems(mappedItems, normalizedSort),
    totalCount: archivedRows.length,
  };
}

export async function canAccessArchive() {
  const { user } = await requireAuthenticatedAppUser();
  const spaces = await getSpacesForUser();
  return Boolean(user.id) && spaces.length > 0;
}

export async function getArchivedWorkOrderDetails(
  archivedWorkOrderId: string,
): Promise<ArchivedWorkOrderDetails | null> {
  const { supabase } = await requireAuthenticatedAppUser();
  const { data: archivedRowData, error: archivedRowError } = await supabase
    .from("archived_work_orders")
    .select("*")
    .eq("id", archivedWorkOrderId)
    .maybeSingle();

  if (archivedRowError) {
    if (isMissingArchiveTableError(archivedRowError)) {
      return null;
    }

    throw new Error(archivedRowError.message);
  }

  const archivedRow = (archivedRowData as ArchivedWorkOrderRow | null) ?? null;

  if (!archivedRow) {
    return null;
  }

  const [
    workOrder,
    overview,
    documentData,
    messages,
    memberData,
    logs,
    folderResult,
    actorResult,
    spaceResult,
  ] = await Promise.all([
    getWorkOrderById(archivedRow.space_id, archivedRow.original_work_order_id),
    getWorkOrderOverviewData(archivedRow.space_id, archivedRow.original_work_order_id),
    getWorkOrderDocuments(archivedRow.space_id, archivedRow.original_work_order_id),
    getWorkOrderMessages(archivedRow.space_id, archivedRow.original_work_order_id),
    getWorkOrderMembers(archivedRow.space_id, archivedRow.original_work_order_id),
    getWorkOrderLogs(archivedRow.space_id, archivedRow.original_work_order_id),
    supabase
      .from("archive_folders")
      .select("name")
      .eq("id", archivedRow.archive_folder_id)
      .maybeSingle(),
    archivedRow.archived_by_user_id
      ? supabase
          .from("profiles")
          .select("full_name")
          .eq("id", archivedRow.archived_by_user_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("spaces")
      .select("name")
      .eq("id", archivedRow.space_id)
      .maybeSingle(),
  ]);

  if (folderResult.error) {
    throw new Error(folderResult.error.message);
  }

  if (actorResult.error) {
    throw new Error(actorResult.error.message);
  }

  if (spaceResult.error) {
    throw new Error(spaceResult.error.message);
  }

  return {
    archivedWorkOrderId: archivedRow.id,
    folderId: archivedRow.archive_folder_id,
    folderName: folderResult.data?.name ?? "Unsorted Archive",
    archivedAtLabel: formatDateTimeLabel(archivedRow.archived_at),
    archivedByName: actorResult.data?.full_name ?? "System",
    spaceName: spaceResult.data?.name ?? "Unknown Space",
    workOrder,
    overview,
    documentFolders: documentData.folders,
    documents: documentData.documents,
    messages,
    members: memberData.members,
    logs,
  };
}
