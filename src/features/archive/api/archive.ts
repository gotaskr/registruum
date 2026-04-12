import "server-only";

import { requireAuthenticatedAppUser } from "@/features/auth/api/profiles";
import { getWorkOrderMessages } from "@/features/chat/api/messages";
import { getWorkOrderDocuments } from "@/features/documents/api/documents";
import { getWorkOrderLogs } from "@/features/logs/api/activity-logs";
import { getWorkOrderMembers } from "@/features/members/api/work-order-members";
import { canAccessSpaceArchive } from "@/features/permissions/lib/roles";
import { getSpacesForUser } from "@/features/spaces/api/spaces";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getArchiveRecordHref } from "@/lib/route-utils";
import {
  getArchiveOwnershipUpgradeMessage,
  isMissingArchiveOwnershipColumnError,
  isMissingArchiveTableError,
} from "@/lib/supabase/schema-compat";
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
import { buildArchiveFolderTreeMetadata } from "@/features/archive/lib/archive-folder-tree";
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
  if (isMissingArchiveOwnershipColumnError(error as { message?: string } | null)) {
    return false;
  }

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

function throwArchiveOwnershipUpgradeErrorIfNeeded(error: unknown) {
  if (isMissingArchiveOwnershipColumnError(error as { message?: string } | null)) {
    throw new Error(getArchiveOwnershipUpgradeMessage());
  }
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
  input: Readonly<{
    depth: number;
    pathLabel: string;
  }>,
  archivedCount: number,
): ArchiveFolder {
  return {
    id: row.id,
    name: row.name,
    parentId: row.parent_id,
    isSystemDefault: row.is_system_default,
    depth: input.depth,
    pathLabel: input.pathLabel,
    archivedCount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapArchiveFolderOption(
  row: ArchiveFolderRow,
  input: Readonly<{
    depth: number;
    pathLabel: string;
  }>,
): ArchiveFolderOption {
  return {
    id: row.id,
    name: row.name,
    parentId: row.parent_id,
    isSystemDefault: row.is_system_default,
    depth: input.depth,
    pathLabel: input.pathLabel,
  };
}

async function ensureDefaultArchiveFolderForSpace(spaceId: string, actorUserId: string) {
  try {
    const adminSupabase = createSupabaseAdminClient();
    const { data: existingFolder, error: existingFolderError } = await adminSupabase
      .from("archive_folders")
      .select("*")
      .eq("is_system_default", true)
      .eq("space_id", spaceId)
      .maybeSingle();

    if (existingFolderError) {
      throwArchiveOwnershipUpgradeErrorIfNeeded(existingFolderError);

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
        created_by_user_id: actorUserId,
        owner_user_id: null,
        space_id: spaceId,
      })
      .select("*")
      .single();

    if (createdFolderError) {
      throwArchiveOwnershipUpgradeErrorIfNeeded(createdFolderError);

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

function getArchiveAccessibleSpaces(
  spaces: Awaited<ReturnType<typeof getSpacesForUser>>,
) {
  return spaces.filter((space) => canAccessSpaceArchive(space.membershipRole));
}

function getArchiveFolderQuery(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  spaceId: string,
) {
  return supabase
    .from("archive_folders")
    .select("*")
    .eq("space_id", spaceId)
    .order("is_system_default", { ascending: false })
    .order("name", { ascending: true });
}

export async function getArchiveFolderOptions(spaceId?: string | null) {
  try {
    const { user } = await requireAuthenticatedAppUser();
    const spaces = await getSpacesForUser();
    const archiveAccessibleSpaces = getArchiveAccessibleSpaces(spaces);
    const accessibleSpaceIds = new Set(archiveAccessibleSpaces.map((space) => space.id));

    if (!spaceId || !accessibleSpaceIds.has(spaceId)) {
      return getArchiveUnavailableFolderOptions();
    }

    const folderSupabase = createSupabaseAdminClient();
    const defaultFolder = await ensureDefaultArchiveFolderForSpace(spaceId, user.id);

    if (!defaultFolder) {
      return getArchiveUnavailableFolderOptions();
    }

    const { data, error } = await getArchiveFolderQuery(folderSupabase, spaceId);

    if (error) {
      throwArchiveOwnershipUpgradeErrorIfNeeded(error);

      if (isMissingArchiveTableError(error)) {
        return getArchiveUnavailableFolderOptions();
      }

      throw new Error(error.message);
    }

    const folderRows = (data ?? []) as ArchiveFolderRow[];
    const folderTree = buildArchiveFolderTreeMetadata(
      folderRows.map((row) => ({
        id: row.id,
        name: row.name,
        parentId: row.parent_id,
        isSystemDefault: row.is_system_default,
      })),
    );
    const folderById = new Map(folderRows.map((row) => [row.id, row]));
    const folderOptions = folderTree.orderedIds
      .map((folderId) => folderById.get(folderId))
      .filter((row): row is ArchiveFolderRow => Boolean(row))
      .map((row) =>
        mapArchiveFolderOption(row, {
          depth: folderTree.depthById.get(row.id) ?? 0,
          pathLabel: folderTree.pathLabelById.get(row.id) ?? row.name,
        }),
      );

    return {
      defaultFolderId: defaultFolder.id,
      folders: folderOptions,
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
  const { supabase, user } = await requireAuthenticatedAppUser();
  const spaces = await getSpacesForUser();
  const rawQuery = query?.trim() ?? "";
  const normalizedQuery = rawQuery.toLowerCase();
  const normalizedSort = normalizeArchiveSort(sort);
  const archiveAccessibleSpaces = getArchiveAccessibleSpaces(spaces);
  const accessibleSpaceIds = archiveAccessibleSpaces.map((space) => space.id);
  const archiveAccessibleSpaceIds = new Set(accessibleSpaceIds);
  const spaceOptions: ArchiveSpaceFilterOption[] = archiveAccessibleSpaces.map((space) => ({
    id: space.id,
    name: space.name,
  }));
  const selectedSpaceId =
    spaceId && archiveAccessibleSpaceIds.has(spaceId) ? spaceId : null;
  if (accessibleSpaceIds.length === 0) {
    return {
      folders: [],
      folderOptions: [],
      spaceOptions,
      selectedFolderId: null,
      selectedSpaceId,
      defaultFolderId: "",
      searchQuery: rawQuery,
      sort: normalizedSort,
      items: [],
      totalCount: 0,
    };
  }

  const archiveSupabase = createSupabaseAdminClient();
  let mappedFolderOptions: ArchiveFolderOption[] = [];
  let selectedFolderId: string | null = null;
  let selectedFolderIds: Set<string> | null = null;
  let defaultFolderId = "";
  let orderedFolderRows: ArchiveFolderRow[] = [];
  let folderTreeMetadata: ReturnType<typeof buildArchiveFolderTreeMetadata> | null = null;

  if (selectedSpaceId) {
    const defaultFolder = await ensureDefaultArchiveFolderForSpace(selectedSpaceId, user.id);

    if (!defaultFolder) {
      return {
        folders: [],
        folderOptions: [],
        spaceOptions,
        selectedFolderId: null,
        selectedSpaceId,
        defaultFolderId: "",
        searchQuery: rawQuery,
        sort: normalizedSort,
        items: [],
        totalCount: 0,
      };
    }

    defaultFolderId = defaultFolder.id;

    const { data: selectedFolderData, error: selectedFolderError } = await getArchiveFolderQuery(
      archiveSupabase,
      selectedSpaceId,
    );

    if (selectedFolderError) {
      throwArchiveOwnershipUpgradeErrorIfNeeded(selectedFolderError);

      if (isMissingArchiveTableError(selectedFolderError)) {
        return {
          folders: [],
          folderOptions: [],
          spaceOptions,
          selectedFolderId: null,
          selectedSpaceId,
          defaultFolderId: "",
          searchQuery: rawQuery,
          sort: normalizedSort,
          items: [],
          totalCount: 0,
        };
      }

      throw new Error(selectedFolderError.message);
    }

    const folderRowsForSelectedSpace = (selectedFolderData ?? []) as ArchiveFolderRow[];
    folderTreeMetadata = buildArchiveFolderTreeMetadata(
      folderRowsForSelectedSpace.map((row) => ({
        id: row.id,
        name: row.name,
        parentId: row.parent_id,
        isSystemDefault: row.is_system_default,
      })),
    );
    const folderById = new Map(folderRowsForSelectedSpace.map((row) => [row.id, row]));
    orderedFolderRows = folderTreeMetadata.orderedIds
      .map((currentFolderId) => folderById.get(currentFolderId))
      .filter((row): row is ArchiveFolderRow => Boolean(row));
    mappedFolderOptions = orderedFolderRows.map((row) =>
      mapArchiveFolderOption(row, {
        depth: folderTreeMetadata?.depthById.get(row.id) ?? 0,
        pathLabel: folderTreeMetadata?.pathLabelById.get(row.id) ?? row.name,
      }),
    );
    selectedFolderId =
      folderId && folderById.has(folderId) ? folderId : null;
    selectedFolderIds = selectedFolderId
      ? new Set(folderTreeMetadata.descendantIdsById.get(selectedFolderId) ?? [selectedFolderId])
      : null;
  }

  const { data: allFolderData, error: allFolderError } = await archiveSupabase
    .from("archive_folders")
    .select("id, name, parent_id, is_system_default, space_id")
    .in("space_id", accessibleSpaceIds);

  if (allFolderError) {
    throwArchiveOwnershipUpgradeErrorIfNeeded(allFolderError);

    if (isMissingArchiveTableError(allFolderError)) {
      return {
        folders: [],
        folderOptions: mappedFolderOptions,
        spaceOptions,
        selectedFolderId,
        selectedSpaceId,
        defaultFolderId,
        searchQuery: rawQuery,
        sort: normalizedSort,
        items: [],
        totalCount: 0,
      };
    }

    throw new Error(allFolderError.message);
  }

  const allFolderRows = (allFolderData ?? []) as (Pick<
    ArchiveFolderRow,
    "id" | "name" | "parent_id" | "is_system_default" | "space_id"
  >)[];
  const folderNameById = new Map<string, string>();

  for (const currentSpaceId of accessibleSpaceIds) {
    const currentFolderRows = allFolderRows.filter((row) => row.space_id === currentSpaceId);
    const currentTree = buildArchiveFolderTreeMetadata(
      currentFolderRows.map((row) => ({
        id: row.id,
        name: row.name,
        parentId: row.parent_id,
        isSystemDefault: row.is_system_default,
      })),
    );

    for (const row of currentFolderRows) {
      folderNameById.set(row.id, currentTree.pathLabelById.get(row.id) ?? row.name);
    }
  }

  let archivedQuery = supabase
    .from("archived_work_orders")
    .select("*")
    .in("space_id", accessibleSpaceIds);

  if (selectedSpaceId) {
    archivedQuery = archivedQuery.eq("space_id", selectedSpaceId);
  }

  const { data: archivedData, error: archivedError } = await archivedQuery;

  if (archivedError) {
    throwArchiveOwnershipUpgradeErrorIfNeeded(archivedError);

    if (isMissingArchiveTableError(archivedError)) {
      return {
        folders: selectedSpaceId && folderTreeMetadata
          ? orderedFolderRows.map((row) =>
              mapArchiveFolder(
                row,
                {
                  depth: folderTreeMetadata?.depthById.get(row.id) ?? 0,
                  pathLabel: folderTreeMetadata?.pathLabelById.get(row.id) ?? row.name,
                },
                0,
              ),
            )
          : [],
        folderOptions: mappedFolderOptions,
        spaceOptions,
        selectedFolderId,
        selectedSpaceId,
        defaultFolderId,
        searchQuery: rawQuery,
        sort: normalizedSort,
        items: [],
        totalCount: 0,
      };
    }

    throw new Error(archivedError.message);
  }

  const archivedRows = (archivedData ?? []) as ArchivedWorkOrderRow[];
  const scopedArchivedRows = archivedRows;
  const actorIds = [
    ...new Set(
      scopedArchivedRows
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
  const directArchivedCountByFolderId = new Map<string, number>();

  for (const row of scopedArchivedRows) {
    directArchivedCountByFolderId.set(
      row.archive_folder_id,
      (directArchivedCountByFolderId.get(row.archive_folder_id) ?? 0) + 1,
    );
  }
  const archivedCountByFolderId = new Map<string, number>();

  if (folderTreeMetadata) {
    for (const row of orderedFolderRows) {
      const descendantIds = folderTreeMetadata.descendantIdsById.get(row.id) ?? [row.id];
      const aggregateCount = descendantIds.reduce(
        (total, descendantId) => total + (directArchivedCountByFolderId.get(descendantId) ?? 0),
        0,
      );

      archivedCountByFolderId.set(row.id, aggregateCount);
    }
  }

  const mappedItems = scopedArchivedRows
    .filter((row) =>
      selectedFolderIds ? selectedFolderIds.has(row.archive_folder_id) : true,
    )
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
      folderName: folderNameById.get(row.archive_folder_id) ?? "Unsorted Archive",
      archivedByUserId: row.archived_by_user_id,
      archivedByName: row.archived_by_user_id
        ? (profileById.get(row.archived_by_user_id)?.full_name ?? "Unknown User")
        : "System",
      archivedAt: row.archived_at,
      archivedAtLabel: formatDateTimeLabel(row.archived_at),
      viewHref: getArchiveRecordHref(row.id),
    }));

  return {
    folders: selectedSpaceId && folderTreeMetadata
      ? orderedFolderRows.map((row) =>
          mapArchiveFolder(
            row,
            {
              depth: folderTreeMetadata.depthById.get(row.id) ?? 0,
              pathLabel: folderTreeMetadata.pathLabelById.get(row.id) ?? row.name,
            },
            archivedCountByFolderId.get(row.id) ?? 0,
          ),
        )
      : [],
    folderOptions: mappedFolderOptions,
    spaceOptions,
    selectedFolderId,
    selectedSpaceId,
    defaultFolderId,
    searchQuery: rawQuery,
    sort: normalizedSort,
    items: sortArchivedItems(mappedItems, normalizedSort),
    totalCount: scopedArchivedRows.length,
  };
}

export async function canAccessArchive() {
  const { user } = await requireAuthenticatedAppUser();
  const spaces = await getSpacesForUser();
  return Boolean(user.id) && getArchiveAccessibleSpaces(spaces).length > 0;
}

export async function getArchivedWorkOrderDetails(
  archivedWorkOrderId: string,
): Promise<ArchivedWorkOrderDetails | null> {
  const { supabase } = await requireAuthenticatedAppUser();
  const spaces = await getSpacesForUser();
  const adminSupabase = createSupabaseAdminClient();
  const { data: archivedRowData, error: archivedRowError } = await adminSupabase
    .from("archived_work_orders")
    .select("*")
    .eq("id", archivedWorkOrderId)
    .maybeSingle();

  if (archivedRowError) {
    throwArchiveOwnershipUpgradeErrorIfNeeded(archivedRowError);

    if (isMissingArchiveTableError(archivedRowError)) {
      return null;
    }

    throw new Error(archivedRowError.message);
  }

  const archivedRow = (archivedRowData as ArchivedWorkOrderRow | null) ?? null;

  if (!archivedRow) {
    return null;
  }

  const hasSpaceArchiveAccess = spaces.some(
    (space) =>
      space.id === archivedRow.space_id && canAccessSpaceArchive(space.membershipRole),
  );

  if (!hasSpaceArchiveAccess) {
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
    adminSupabase
      .from("archive_folders")
      .select("id, name, parent_id, is_system_default")
      .eq("space_id", archivedRow.space_id)
      .order("is_system_default", { ascending: false })
      .order("name", { ascending: true }),
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

  const folderRows = (folderResult.data ?? []) as Pick<
    ArchiveFolderRow,
    "id" | "name" | "parent_id" | "is_system_default"
  >[];
  const folderTree = buildArchiveFolderTreeMetadata(
    folderRows.map((row) => ({
      id: row.id,
      name: row.name,
      parentId: row.parent_id,
      isSystemDefault: row.is_system_default,
    })),
  );

  return {
    archivedWorkOrderId: archivedRow.id,
    spaceId: archivedRow.space_id,
    folderId: archivedRow.archive_folder_id,
    folderName:
      folderTree.pathLabelById.get(archivedRow.archive_folder_id) ?? "Unsorted Archive",
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
