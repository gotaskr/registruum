import "server-only";

import { notFound, redirect } from "next/navigation";
import { getArchiveFolderOptions } from "@/features/archive/api/archive";
import { requireAuthenticatedAppUser } from "@/features/auth/api/profiles";
import {
  mapActivityLogRow,
  type ActivityLogProfile,
} from "@/features/logs/lib/log-entry";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  createPermissionValues,
  createDefaultWorkOrderPermissionMatrix,
  editableWorkOrderRoles,
  type EditableWorkOrderRole,
  type WorkOrderPermissionKey,
} from "@/features/permissions/lib/work-order-permission-definitions";
import { getWorkOrderPermissionSet } from "@/features/permissions/lib/work-order-permissions";
import {
  canAccessSpaceOverview,
  isPrimarySpaceRole,
  isSpaceTeamRole,
} from "@/features/permissions/lib/roles";
import { syncSpaceTeamMembershipAcrossExistingWorkOrders } from "@/features/work-orders/lib/space-team-memberships";
import { isMissingSpaceMembershipStatusColumn } from "@/lib/supabase/schema-compat";
import type { Database } from "@/types/database";
import type { WorkOrder, WorkOrderSubjectType } from "@/types/work-order";
import type { WorkOrderOverviewData } from "@/features/work-orders/types/work-order-overview";
import type { WorkOrderSettingsData } from "@/features/work-orders/types/work-order-settings";
import { registruumFilesBucket } from "@/lib/supabase/storage";

type WorkOrderRow = Database["public"]["Tables"]["work_orders"]["Row"];
type SpaceMembershipRow =
  Database["public"]["Tables"]["space_memberships"]["Row"];
type WorkOrderMembershipRow =
  Database["public"]["Tables"]["work_order_memberships"]["Row"];
type ActivityLogRow = Database["public"]["Tables"]["activity_logs"]["Row"];
type DocumentPreviewRow = Pick<
  Database["public"]["Tables"]["documents"]["Row"],
  "id" | "title" | "storage_path"
>;
type ProfileSettingsRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name" | "email"
>;
type WorkOrderRolePermissionRow = Database["public"]["Tables"]["work_order_role_permissions"]["Row"];
type AuthenticatedAppUser = Awaited<ReturnType<typeof requireAuthenticatedAppUser>>;

export type WorkOrderActorContext = Readonly<{
  supabase: AuthenticatedAppUser["supabase"];
  user: AuthenticatedAppUser["user"];
  profile: AuthenticatedAppUser["profile"];
  workOrder: WorkOrder;
  spaceRole: SpaceMembershipRow["role"];
  workOrderRole: WorkOrderMembershipRow["role"] | null;
  actorRole: NonNullable<WorkOrder["actorRole"]>;
  isAssigned: boolean;
  permissions: ReturnType<typeof getWorkOrderPermissionSet>;
  permissionMatrix: ReturnType<typeof createDefaultWorkOrderPermissionMatrix>;
}>;

function mapWorkOrderRow(
  row: WorkOrderRow,
  actorRole: WorkOrder["actorRole"],
): WorkOrder {
  return {
    id: row.id,
    spaceId: row.space_id,
    createdByUserId: row.created_by_user_id,
    title: row.title,
    subjectType: (row.subject_type as WorkOrderSubjectType | null) ?? "issue",
    subject: row.subject,
    locationLabel: row.location_label,
    unitLabel: row.unit_label,
    description: row.description,
    priority: (row.priority as WorkOrder["priority"] | null) ?? "medium",
    startDate: row.start_date,
    dueDate: row.due_date ?? row.expiration_at,
    expirationAt: row.expiration_at,
    ownerUserId: row.owner_user_id ?? row.created_by_user_id,
    vendorName: row.vendor_name,
    autoSaveChatAttachments: row.auto_save_chat_attachments ?? true,
    allowDocumentDeletionInProgress:
      row.allow_document_deletion_in_progress ?? true,
    lockDocumentsOnCompleted: row.lock_documents_on_completed ?? true,
    status: row.status,
    actorRole,
    isPostedToJobMarket: row.is_posted_to_job_market,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function resolveWorkOrderPermissionMatrix(workOrderId: string) {
  const adminSupabase = createSupabaseAdminClient();
  const { data, error } = await adminSupabase
    .from("work_order_role_permissions")
    .select("role, permission_key, is_allowed")
    .eq("work_order_id", workOrderId);

  if (error) {
    return createDefaultWorkOrderPermissionMatrix();
  }

  const defaults = createDefaultWorkOrderPermissionMatrix();
  const matrix = Object.fromEntries(
    editableWorkOrderRoles.map((role) => [role, createPermissionValues(defaults[role])]),
  ) as Record<EditableWorkOrderRole, Record<WorkOrderPermissionKey, boolean>>;

  for (const row of (data ?? []) as Pick<
    WorkOrderRolePermissionRow,
    "role" | "permission_key" | "is_allowed"
  >[]) {
    if (row.role in matrix) {
      matrix[row.role][
        row.permission_key as keyof (typeof matrix)[EditableWorkOrderRole]
      ] = row.is_allowed;
    }
  }

  return matrix as ReturnType<typeof createDefaultWorkOrderPermissionMatrix>;
}

async function resolveSpaceMembership(
  authenticated: AuthenticatedAppUser,
  spaceId: string,
  userId: string,
) {
  let query = await authenticated.supabase
    .from("space_memberships")
    .select("*")
    .eq("space_id", spaceId)
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (isMissingSpaceMembershipStatusColumn(query.error)) {
    query = await authenticated.supabase
      .from("space_memberships")
      .select("*")
      .eq("space_id", spaceId)
      .eq("user_id", userId)
      .single();
  }

  const { data, error } = query;

  if (error) {
    return null;
  }

  return data as SpaceMembershipRow;
}

async function resolveWorkOrderAssignment(
  authenticated: AuthenticatedAppUser,
  workOrderId: string,
  userId: string,
) {
  const { data, error } = await authenticated.supabase
    .from("work_order_memberships")
    .select("id, role")
    .eq("work_order_id", workOrderId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data;
}

async function resolveWorkOrderRow(
  authenticated: AuthenticatedAppUser,
  spaceId: string,
  workOrderId: string,
) {
  const { data, error } = await authenticated.supabase
    .from("work_orders")
    .select("*")
    .eq("space_id", spaceId)
    .eq("id", workOrderId)
    .single();

  if (error) {
    return null;
  }

  return data as WorkOrderRow;
}

async function resolveWorkOrderActorContext(
  spaceId: string,
  workOrderId: string,
) {
  const authenticated = await requireAuthenticatedAppUser();
  const membership = await resolveSpaceMembership(
    authenticated,
    spaceId,
    authenticated.user.id,
  );

  if (!membership) {
    return null;
  }

  const workOrderRow = await resolveWorkOrderRow(
    authenticated,
    spaceId,
    workOrderId,
  );

  if (!workOrderRow) {
    return null;
  }

  const assignment = await resolveWorkOrderAssignment(
    authenticated,
    workOrderId,
    authenticated.user.id,
  );
  const isAssigned = Boolean(assignment);
  const actorRole = isPrimarySpaceRole(membership.role)
    ? membership.role
    : membership.role === "field_lead_superintendent" && isAssigned
      ? "field_lead_superintendent"
      : assignment?.role ?? null;
  const workOrder = mapWorkOrderRow(workOrderRow, actorRole);
  const permissionMatrix = await resolveWorkOrderPermissionMatrix(workOrderId);
  const permissions = getWorkOrderPermissionSet({
    role: actorRole,
    status: workOrder.status,
    isOwner: authenticated.user.id === workOrder.ownerUserId,
    documentRules: {
      allowDocumentDeletionInProgress:
        workOrder.allowDocumentDeletionInProgress,
      lockDocumentsOnCompleted: workOrder.lockDocumentsOnCompleted,
    },
    rolePermissionMatrix: permissionMatrix,
  });

  if (!actorRole || !permissions.canView) {
    return null;
  }

  return {
    supabase: authenticated.supabase,
    user: authenticated.user,
    profile: authenticated.profile,
    workOrder,
    spaceRole: membership.role,
    workOrderRole: assignment?.role ?? null,
    actorRole,
    isAssigned,
    permissions,
    permissionMatrix,
  } satisfies WorkOrderActorContext;
}

export async function getSpaceMembershipForAction(spaceId: string) {
  const authenticated = await requireAuthenticatedAppUser();
  const membership = await resolveSpaceMembership(
    authenticated,
    spaceId,
    authenticated.user.id,
  );

  if (!membership) {
    return null;
  }

  return {
    supabase: authenticated.supabase,
    user: authenticated.user,
    profile: authenticated.profile,
    spaceRole: membership.role,
  };
}

export async function getWorkOrdersForSpace(spaceId: string) {
  const authenticated = await requireAuthenticatedAppUser();
  const membership = await resolveSpaceMembership(
    authenticated,
    spaceId,
    authenticated.user.id,
  );

  if (!membership) {
    notFound();
  }

  if (canAccessSpaceOverview(membership.role)) {
    const { data, error } = await authenticated.supabase
      .from("work_orders")
      .select("*")
      .eq("space_id", spaceId)
      .neq("status", "archived")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as WorkOrderRow[]).map((row) =>
      mapWorkOrderRow(row, membership.role),
    );
  }

  if (isSpaceTeamRole(membership.role)) {
    await syncSpaceTeamMembershipAcrossExistingWorkOrders({
      supabase: createSupabaseAdminClient(),
      spaceId,
      userId: authenticated.user.id,
      role: membership.role,
      assignedByUserId: authenticated.user.id,
    });
  }

  const { data: assignmentRows, error: assignmentError } = await authenticated.supabase
    .from("work_order_memberships")
    .select("work_order_id, role")
    .eq("user_id", authenticated.user.id)
    .order("created_at", { ascending: false });

  if (assignmentError) {
    throw new Error(assignmentError.message);
  }

  const assignments = (assignmentRows ?? []) as Pick<
    WorkOrderMembershipRow,
    "work_order_id" | "role"
  >[];
  const visibleWorkOrderIds = [...new Set(assignments.map((row) => row.work_order_id))];
  const roleByWorkOrderId = new Map(
    assignments.map((row) => [row.work_order_id, row.role] as const),
  );

  if (visibleWorkOrderIds.length === 0) {
    return [];
  }

  const { data, error } = await authenticated.supabase
    .from("work_orders")
    .select("*")
    .eq("space_id", spaceId)
    .in("id", visibleWorkOrderIds)
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as WorkOrderRow[]).map((row) =>
    mapWorkOrderRow(row, roleByWorkOrderId.get(row.id) ?? null),
  );
}

export async function getWorkOrderActorContext(
  spaceId: string,
  workOrderId: string,
) {
  const context = await resolveWorkOrderActorContext(spaceId, workOrderId);

  if (context) {
    return context;
  }

  const adminSupabase = createSupabaseAdminClient();
  const { data: workOrderRow } = await adminSupabase
    .from("work_orders")
    .select("status")
    .eq("space_id", spaceId)
    .eq("id", workOrderId)
    .maybeSingle();

  const status = workOrderRow?.status as string | undefined;
  const isActivePipeline =
    status === "open" ||
    status === "in_progress" ||
    status === "on_hold";

  if (isActivePipeline) {
    redirect("/");
  }

  notFound();
}

export async function getWorkOrderActorContextForAction(
  spaceId: string,
  workOrderId: string,
) {
  return resolveWorkOrderActorContext(spaceId, workOrderId);
}

export async function getWorkOrderById(spaceId: string, workOrderId: string) {
  const context = await getWorkOrderActorContext(spaceId, workOrderId);
  return context.workOrder;
}

export async function getWorkOrderMemberCount(spaceId: string, workOrderId: string) {
  const context = await getWorkOrderActorContext(spaceId, workOrderId);
  const { count, error } = await context.supabase
    .from("work_order_memberships")
    .select("id", { count: "exact", head: true })
    .eq("work_order_id", workOrderId);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function getWorkOrderOverviewData(
  spaceId: string,
  workOrderId: string,
): Promise<WorkOrderOverviewData> {
  const context = await getWorkOrderActorContext(spaceId, workOrderId);
  const [
    createdByResult,
    memberCountResult,
    documentCountResult,
    photoCountResult,
    photoRowsResult,
    activityCountResult,
  ] = await Promise.all([
    context.supabase
      .from("profiles")
      .select("full_name")
      .eq("id", context.workOrder.createdByUserId)
      .maybeSingle(),
    context.supabase
      .from("work_order_memberships")
      .select("id", { count: "exact", head: true })
      .eq("work_order_id", workOrderId),
    context.supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("work_order_id", workOrderId)
      .eq("is_archived", false),
    context.supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("work_order_id", workOrderId)
      .eq("is_archived", false)
      .eq("document_kind", "photo")
      .eq("source", "manual"),
    context.supabase
      .from("documents")
      .select("id, title, storage_path")
      .eq("work_order_id", workOrderId)
      .eq("is_archived", false)
      .eq("document_kind", "photo")
      .eq("source", "manual")
      .not("storage_path", "is", null)
      .order("created_at", { ascending: false })
      .limit(12),
    context.permissions.canViewLogs
      ? context.supabase
          .from("activity_logs")
          .select("id", { count: "exact", head: true })
          .eq("space_id", spaceId)
          .eq("work_order_id", workOrderId)
      : Promise.resolve({ count: 0, error: null }),
  ]);

  if (createdByResult.error) {
    throw new Error(createdByResult.error.message);
  }

  if (memberCountResult.error) {
    throw new Error(memberCountResult.error.message);
  }

  if (documentCountResult.error) {
    throw new Error(documentCountResult.error.message);
  }

  if (photoCountResult.error) {
    throw new Error(photoCountResult.error.message);
  }

  if (photoRowsResult.error) {
    throw new Error(photoRowsResult.error.message);
  }

  if (activityCountResult.error) {
    throw new Error(activityCountResult.error.message);
  }

  const photoRows = (photoRowsResult.data ?? []) as DocumentPreviewRow[];
  const photoUrlEntries = await Promise.all(
    photoRows.map(async (photo) => {
      if (!photo.storage_path) {
        return [photo.id, null] as const;
      }

      const { data, error } = await context.supabase.storage
        .from(registruumFilesBucket)
        .createSignedUrl(photo.storage_path, 60 * 60);

      if (error || !data?.signedUrl) {
        return [photo.id, null] as const;
      }

      return [photo.id, data.signedUrl] as const;
    }),
  );
  const photoUrlById = new Map(photoUrlEntries);
  const photos = photoRows
    .map((photo) => {
      const previewUrl = photoUrlById.get(photo.id) ?? null;

      if (!previewUrl) {
        return null;
      }

      return {
        id: photo.id,
        title: photo.title,
        previewUrl,
      };
    })
    .filter((photo): photo is NonNullable<typeof photo> => photo !== null);

  if (!context.permissions.canViewLogs) {
    return {
      createdByName: createdByResult.data?.full_name ?? "Unknown User",
      memberCount: memberCountResult.count ?? 0,
      documentCount: documentCountResult.count ?? 0,
      photoCount: photoCountResult.count ?? 0,
      photos,
      activityCount: 0,
      recentLogs: [],
    };
  }

  const { data: logRows, error: logError } = await context.supabase
    .from("activity_logs")
    .select("*")
    .eq("space_id", spaceId)
    .eq("work_order_id", workOrderId)
    .order("created_at", { ascending: false })
    .limit(5);

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
  const profileById = new Map<string, ActivityLogProfile>();

  if (actorIds.length > 0) {
    const { data: profileRows, error: profileError } = await context.supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", actorIds);

    if (profileError) {
      throw new Error(profileError.message);
    }

    for (const profile of (profileRows ?? []) as ActivityLogProfile[]) {
      profileById.set(profile.id, profile);
    }
  }

  return {
    createdByName: createdByResult.data?.full_name ?? "Unknown User",
    memberCount: memberCountResult.count ?? 0,
    documentCount: documentCountResult.count ?? 0,
    photoCount: photoCountResult.count ?? 0,
    photos,
    activityCount: activityCountResult.count ?? 0,
    recentLogs: rows.map((row) => mapActivityLogRow(row, profileById)),
  };
}

export async function getWorkOrderSettingsData(
  spaceId: string,
  workOrderId: string,
): Promise<WorkOrderSettingsData> {
  const context = await getWorkOrderActorContext(spaceId, workOrderId);
  const archiveFolderOptions = await getArchiveFolderOptions(spaceId);
  const adminSupabase = createSupabaseAdminClient();
  const { data: membershipRows, error: membershipError } = await context.supabase
    .from("work_order_memberships")
    .select("user_id")
    .eq("work_order_id", workOrderId);

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  const ownerIds = [
    ...new Set([
      context.workOrder.ownerUserId,
      context.workOrder.createdByUserId,
      ...((membershipRows ?? []).map((row) => row.user_id) ?? []),
    ]),
  ];

  const { data: ownerRows, error } = await adminSupabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", ownerIds);

  if (error) {
    throw new Error(error.message);
  }

  const ownerOptions = ((ownerRows ?? []) as ProfileSettingsRow[])
    .map((profile) => ({
      id: profile.id,
      name: profile.full_name,
      email: profile.email,
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

  return {
    ownerOptions,
    permissionMatrix: context.permissionMatrix,
    archiveFolders: archiveFolderOptions.folders,
    defaultArchiveFolderId: archiveFolderOptions.defaultFolderId,
  };
}
