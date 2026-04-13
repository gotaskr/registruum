"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createActivityLog } from "@/features/logs/api/activity-logs";
import { requireAuthenticatedAppUser } from "@/features/auth/api/profiles";
import { canAccessSpaceArchive } from "@/features/permissions/lib/roles";
import { getSpacesForUser } from "@/features/spaces/api/spaces";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getArchiveOwnershipUpgradeMessage,
  isMissingArchiveOwnershipColumnError,
} from "@/lib/supabase/schema-compat";
import {
  initialArchiveActionState,
  type ArchiveActionState,
} from "@/features/archive/types/archive";
import { getWorkOrderActorContextForAction } from "@/features/work-orders/api/work-orders";
import type { Database } from "@/types/database";

type ArchiveFolderRow = Database["public"]["Tables"]["archive_folders"]["Row"];
type ArchivedWorkOrderRow = Database["public"]["Tables"]["archived_work_orders"]["Row"];
type ServerSupabaseClient = SupabaseClient<Database>;
type ArchiveActionScope = Readonly<{
  spaceId: string;
  actorUserId: string;
}>;

function toArchiveActionError(error: unknown) {
  if (isMissingArchiveOwnershipColumnError(error as { message?: string } | null)) {
    return new Error(getArchiveOwnershipUpgradeMessage());
  }

  return error instanceof Error ? error : new Error("Archive action failed.");
}

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readBoolean(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "true" || value === "on";
}

async function getDefaultArchiveFolderForSpace(spaceId: string, actorUserId: string) {
  const adminSupabase = createSupabaseAdminClient();
  const { data: existingFolder, error: existingFolderError } = await adminSupabase
    .from("archive_folders")
    .select("*")
    .eq("is_system_default", true)
    .eq("space_id", spaceId)
    .maybeSingle();

  if (existingFolderError) {
    throw toArchiveActionError(existingFolderError);
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
    throw toArchiveActionError(createdFolderError);
  }

  return createdFolder as ArchiveFolderRow;
}

async function resolveArchiveActionScope(
  actorUserId: string,
  requestedSpaceId: string,
): Promise<ArchiveActionScope> {
  if (!requestedSpaceId) {
    throw new Error("A space archive must be selected.");
  }

  const spaces = await getSpacesForUser();
  const accessibleSpace = spaces.find(
    (space) =>
      space.id === requestedSpaceId && canAccessSpaceArchive(space.membershipRole),
  );

  if (!accessibleSpace) {
    throw new Error("You do not have access to this space archive.");
  }

  return {
    spaceId: accessibleSpace.id,
    actorUserId,
  };
}

async function getDefaultArchiveFolderForScope(scope: ArchiveActionScope) {
  return getDefaultArchiveFolderForSpace(scope.spaceId, scope.actorUserId);
}

async function createArchiveActivityLog(input: Readonly<{
  supabase: ServerSupabaseClient;
  archivedWorkOrderId?: string | null;
  archiveFolderId?: string | null;
  action: string;
  actorUserId: string | null;
  metadata?: Database["public"]["Tables"]["archive_activity_logs"]["Insert"]["metadata"];
}>) {
  const { error } = await input.supabase.from("archive_activity_logs").insert({
    archived_work_order_id: input.archivedWorkOrderId ?? null,
    archive_folder_id: input.archiveFolderId ?? null,
    action: input.action,
    actor_user_id: input.actorUserId,
    metadata: input.metadata ?? {},
  });

  if (error) {
    throw toArchiveActionError(error);
  }
}

async function getArchiveFolderById(
  supabase: ServerSupabaseClient,
  folderId: string,
  scope: ArchiveActionScope,
) {
  const query = supabase
    .from("archive_folders")
    .select("*")
    .eq("id", folderId)
    .eq("space_id", scope.spaceId);
  const { data, error } = await query.maybeSingle();

  if (error) {
    throw toArchiveActionError(error);
  }

  return (data as ArchiveFolderRow | null) ?? null;
}

async function resolveArchiveParentFolder(input: Readonly<{
  supabase: ServerSupabaseClient;
  scope: ArchiveActionScope;
  parentFolderId: string;
}>) {
  if (!input.parentFolderId) {
    return null;
  }

  return getArchiveFolderById(input.supabase, input.parentFolderId, input.scope);
}

async function resolveTargetArchiveFolder(input: Readonly<{
  supabase: ServerSupabaseClient;
  scope: ArchiveActionScope;
  archiveFolderId: string;
  newFolderName: string;
  parentFolderId: string;
}>): Promise<ArchiveFolderRow> {
  if (input.newFolderName.length > 0) {
    const parentFolder = await resolveArchiveParentFolder({
      supabase: input.supabase,
      scope: input.scope,
      parentFolderId: input.parentFolderId,
    });

    const { data, error } = await input.supabase
      .from("archive_folders")
      .insert({
        name: input.newFolderName,
        parent_id: parentFolder?.id ?? null,
        created_by_user_id: input.scope.actorUserId,
        owner_user_id: null,
        space_id: input.scope.spaceId,
        is_system_default: false,
      })
      .select("*")
      .single();

    if (error) {
      throw toArchiveActionError(error);
    }

    const createdFolder = data as ArchiveFolderRow;
    await createArchiveActivityLog({
      supabase: input.supabase,
      archiveFolderId: createdFolder.id,
      action: "folder_created",
      actorUserId: input.scope.actorUserId,
      metadata: {
        summary: `Created archive folder '${createdFolder.name}'.`,
        folderName: createdFolder.name,
      },
    });

    return createdFolder;
  }

  if (input.archiveFolderId.length > 0) {
    const existingFolder = await getArchiveFolderById(
      input.supabase,
      input.archiveFolderId,
      input.scope,
    );

    if (existingFolder) {
      return existingFolder;
    }
  }

  return getDefaultArchiveFolderForScope(input.scope);
}

function getReturnPath(returnTo: string, fallback: string) {
  if (returnTo.startsWith("/")) {
    return returnTo;
  }

  return fallback;
}

export async function archiveWorkOrderRecord(
  previousState: ArchiveActionState = initialArchiveActionState,
  formData: FormData,
): Promise<ArchiveActionState> {
  void previousState;

  const workOrderId = readText(formData, "workOrderId");
  const spaceId = readText(formData, "spaceId");
  const archiveFolderId = readText(formData, "archiveFolderId");
  const newFolderName = readText(formData, "newArchiveFolderName");
  const newArchiveParentFolderId = readText(formData, "newArchiveParentFolderId");
  const returnTo = readText(formData, "returnTo");

  const context = await getWorkOrderActorContextForAction(spaceId, workOrderId);

  if (!context) {
    return {
      error: "You do not have access to this work order.",
    };
  }

  if (!context.permissions.canArchiveWorkOrder) {
    return {
      error: "You do not have permission to archive this work order.",
    };
  }

  if (context.workOrder.status === "archived") {
    return {
      error: "This work order is already archived.",
    };
  }

  const scope = await resolveArchiveActionScope(context.user.id, spaceId);
  const archiveSupabase = createSupabaseAdminClient();
  const targetFolder = await resolveTargetArchiveFolder({
    supabase: archiveSupabase,
    scope,
    archiveFolderId,
    newFolderName,
    parentFolderId: newArchiveParentFolderId,
  });
  const actorSupabase = context.supabase;
  const archivedAt = new Date().toISOString();
  const { error: updateError } = await actorSupabase
    .from("work_orders")
    .update({
      status: "archived",
    })
    .eq("id", workOrderId)
    .eq("space_id", spaceId);

  if (updateError) {
    return {
      error: updateError.message,
    };
  }

  const { data: archivedRecord, error: archivedRecordError } = await archiveSupabase
    .from("archived_work_orders")
    .insert({
      original_work_order_id: workOrderId,
      archive_folder_id: targetFolder.id,
      archived_by_user_id: context.user.id,
      owner_user_id: context.user.id,
      archived_at: archivedAt,
      title_snapshot: context.workOrder.title,
      space_id: spaceId,
      status_snapshot: "archived",
      immutable: true,
    })
    .select("*")
    .single();

  if (archivedRecordError) {
    return {
      error: archivedRecordError.message,
    };
  }

  const archiveRow = archivedRecord as ArchivedWorkOrderRow;

  await createArchiveActivityLog({
    supabase: archiveSupabase,
    archivedWorkOrderId: archiveRow.id,
    archiveFolderId: targetFolder.id,
    action: "archive_created",
    actorUserId: context.user.id,
    metadata: {
      summary: `${context.profile.fullName} archived work order '${context.workOrder.title}' into '${targetFolder.name}'.`,
      workOrderTitle: context.workOrder.title,
      folderName: targetFolder.name,
    },
  });

  await createActivityLog({
    supabase: actorSupabase,
    action: "Archived work order",
    actorUserId: context.user.id,
    spaceId,
    workOrderId,
    entityType: "work_order",
    entityId: workOrderId,
    details: {
      summary: `Moved '${context.workOrder.title}' into archive folder '${targetFolder.name}'.`,
      after: "Archived",
    },
  });

  revalidatePath("/archive");
  revalidatePath(`/space/${spaceId}`);
  revalidatePath(`/space/${spaceId}/archive`);
  revalidatePath(`/space/${spaceId}/work-order/${workOrderId}/overview`);
  revalidatePath(`/space/${spaceId}/work-order/${workOrderId}/settings`);

  redirect(getReturnPath(returnTo, `/space/${spaceId}/archive?folder=${targetFolder.id}`));
}

export async function createArchiveFolderAction(formData: FormData) {
  const { user } = await requireAuthenticatedAppUser();
  const name = readText(formData, "name");
  const parentFolderId = readText(formData, "parentFolderId");
  const spaceId = readText(formData, "spaceId");
  const returnTo = readText(formData, "returnTo");

  if (!name) {
    redirect(getReturnPath(returnTo, "/archive"));
  }

  const scope = await resolveArchiveActionScope(user.id, spaceId);
  const archiveSupabase = createSupabaseAdminClient();

  const parentFolder = await resolveArchiveParentFolder({
    supabase: archiveSupabase,
    scope,
    parentFolderId,
  });

  const { data, error } = await archiveSupabase
    .from("archive_folders")
    .insert({
      name,
      parent_id: parentFolder?.id ?? null,
      created_by_user_id: user.id,
      owner_user_id: null,
      space_id: scope.spaceId,
      is_system_default: false,
    })
    .select("*")
    .single();

  if (error) {
    throw toArchiveActionError(error);
  }

  const folder = data as ArchiveFolderRow;

  await createArchiveActivityLog({
    supabase: archiveSupabase,
    archiveFolderId: folder.id,
    action: "folder_created",
    actorUserId: user.id,
    metadata: {
      summary: `${user.email ?? "A user"} created archive folder '${folder.name}'.`,
      folderName: folder.name,
    },
  });

  revalidatePath("/archive");
  revalidatePath(`/space/${scope.spaceId}/archive`);
  redirect(getReturnPath(returnTo, `/space/${scope.spaceId}/archive?folder=${folder.id}`));
}

export async function renameArchiveFolderAction(formData: FormData) {
  const { user } = await requireAuthenticatedAppUser();
  const folderId = readText(formData, "folderId");
  const name = readText(formData, "name");
  const spaceId = readText(formData, "spaceId");
  const returnTo = readText(formData, "returnTo");

  if (!folderId || !name) {
    redirect(getReturnPath(returnTo, "/archive"));
  }

  const scope = await resolveArchiveActionScope(user.id, spaceId);
  const archiveSupabase = createSupabaseAdminClient();
  const currentFolder = await getArchiveFolderById(archiveSupabase, folderId, scope);

  if (!currentFolder || currentFolder.is_system_default) {
    redirect(getReturnPath(returnTo, "/archive"));
  }

  const updateQuery = archiveSupabase
    .from("archive_folders")
    .update({
      name,
    })
    .eq("id", folderId);
  const { error } =
    await updateQuery.eq("space_id", scope.spaceId);

  if (error) {
    throw toArchiveActionError(error);
  }

  await createArchiveActivityLog({
    supabase: archiveSupabase,
    archiveFolderId: folderId,
    action: "folder_renamed",
    actorUserId: user.id,
    metadata: {
      summary: `${user.email ?? "A user"} renamed archive folder '${currentFolder.name}' to '${name}'.`,
      before: currentFolder.name,
      after: name,
    },
  });

  revalidatePath("/archive");
  revalidatePath(`/space/${scope.spaceId}/archive`);
  redirect(getReturnPath(returnTo, `/space/${scope.spaceId}/archive?folder=${folderId}`));
}

export async function moveArchivedWorkOrderAction(formData: FormData) {
  const archivedWorkOrderId = readText(formData, "archivedWorkOrderId");
  const targetFolderId = readText(formData, "targetFolderId");
  const spaceId = readText(formData, "spaceId");
  const returnTo = readText(formData, "returnTo");

  if (!archivedWorkOrderId || !targetFolderId) {
    redirect(getReturnPath(returnTo, "/archive"));
  }

  const { user } = await requireAuthenticatedAppUser();
  const scope = await resolveArchiveActionScope(user.id, spaceId);
  const archiveSupabase = createSupabaseAdminClient();
  const archivedQuery = archiveSupabase
    .from("archived_work_orders")
    .select("*")
    .eq("id", archivedWorkOrderId)
    .eq("space_id", scope.spaceId);
  const { data: archivedData, error: archivedError } = await archivedQuery.maybeSingle();

  if (archivedError) {
    throw toArchiveActionError(archivedError);
  }

  const archivedRow = (archivedData as ArchivedWorkOrderRow | null);

  if (!archivedRow) {
    redirect(getReturnPath(returnTo, "/archive"));
  }

  const context = await getWorkOrderActorContextForAction(
    archivedRow.space_id,
    archivedRow.original_work_order_id,
  );

  if (!context) {
    redirect(getReturnPath(returnTo, "/archive"));
  }

  const currentFolder = await getArchiveFolderById(
    archiveSupabase,
    archivedRow.archive_folder_id,
    scope,
  );
  const targetFolder = await getArchiveFolderById(
    archiveSupabase,
    targetFolderId,
    scope,
  );

  if (!currentFolder || !targetFolder || currentFolder.id === targetFolder.id) {
    redirect(getReturnPath(returnTo, "/archive"));
  }

  const moveQuery = archiveSupabase
    .from("archived_work_orders")
    .update({
      archive_folder_id: targetFolder.id,
    })
    .eq("id", archivedWorkOrderId);
  const { error: moveError } =
    await moveQuery.eq("space_id", scope.spaceId);

  if (moveError) {
    throw toArchiveActionError(moveError);
  }

  await createArchiveActivityLog({
    supabase: archiveSupabase,
    archivedWorkOrderId,
    archiveFolderId: targetFolder.id,
    action: "archived_work_order_moved",
    actorUserId: context.user.id,
    metadata: {
      summary: `${context.profile.fullName} moved archived work order '${archivedRow.title_snapshot}' from '${currentFolder.name}' to '${targetFolder.name}'.`,
      workOrderTitle: archivedRow.title_snapshot,
      fromFolderName: currentFolder.name,
      toFolderName: targetFolder.name,
    },
  });

  await createActivityLog({
    supabase: context.supabase,
    action: "Moved archived work order",
    actorUserId: context.user.id,
    spaceId: archivedRow.space_id,
    workOrderId: archivedRow.original_work_order_id,
    entityType: "work_order",
    entityId: archivedRow.original_work_order_id,
    details: {
      summary: `Moved from '${currentFolder.name}' to '${targetFolder.name}'.`,
      before: currentFolder.name,
      after: targetFolder.name,
    },
  });

  revalidatePath("/archive");
  revalidatePath(`/space/${scope.spaceId}/archive`);
  redirect(getReturnPath(returnTo, `/space/${scope.spaceId}/archive?folder=${targetFolder.id}`));
}

export async function deleteArchiveFolderAction(formData: FormData) {
  const { user } = await requireAuthenticatedAppUser();
  const folderId = readText(formData, "folderId");
  const forceMoveContents = readBoolean(formData, "forceMoveContents");
  const spaceId = readText(formData, "spaceId");
  const returnTo = readText(formData, "returnTo");

  if (!folderId) {
    redirect(getReturnPath(returnTo, "/archive"));
  }

  const scope = await resolveArchiveActionScope(user.id, spaceId);
  const archiveSupabase = createSupabaseAdminClient();

  const currentFolder = await getArchiveFolderById(archiveSupabase, folderId, scope);

  if (!currentFolder || currentFolder.is_system_default) {
    redirect(getReturnPath(returnTo, "/archive"));
  }

  const defaultFolder = await getDefaultArchiveFolderForScope(scope);
  const childFolderQuery = archiveSupabase
    .from("archive_folders")
    .select("id")
    .eq("parent_id", folderId);
  const { data: childFolderData, error: childFolderError } =
    await childFolderQuery.eq("space_id", scope.spaceId);

  if (childFolderError) {
    throw toArchiveActionError(childFolderError);
  }

  const childFolderIds = ((childFolderData ?? []) as Pick<ArchiveFolderRow, "id">[]).map(
    (folder) => folder.id,
  );

  if (childFolderIds.length > 0) {
    const { error: reparentError } = await archiveSupabase
      .from("archive_folders")
      .update({
        parent_id: currentFolder.parent_id,
      })
      .in("id", childFolderIds);

    if (reparentError) {
      throw toArchiveActionError(reparentError);
    }
  }

  const archivedQuery = archiveSupabase
    .from("archived_work_orders")
    .select("*")
    .eq("archive_folder_id", folderId);
  const { data: archivedData, error: archivedError } =
    await archivedQuery.eq("space_id", scope.spaceId);

  if (archivedError) {
    throw toArchiveActionError(archivedError);
  }

  const archivedRows = (archivedData ?? []) as ArchivedWorkOrderRow[];

  if (archivedRows.length > 0 && !forceMoveContents) {
    redirect(getReturnPath(returnTo, `/archive?folder=${folderId}`));
  }

  if (archivedRows.length > 0) {
    const moveQuery = archiveSupabase
      .from("archived_work_orders")
      .update({
        archive_folder_id: defaultFolder.id,
      })
      .eq("archive_folder_id", folderId);
    const { error: moveError } =
      await moveQuery.eq("space_id", scope.spaceId);

    if (moveError) {
      throw toArchiveActionError(moveError);
    }

    for (const archivedRow of archivedRows) {
      await createArchiveActivityLog({
        supabase: archiveSupabase,
        archivedWorkOrderId: archivedRow.id,
        archiveFolderId: defaultFolder.id,
        action: "archived_work_order_moved",
        actorUserId: user.id,
        metadata: {
          summary: `${user.email ?? "A user"} moved archived work order '${archivedRow.title_snapshot}' from '${currentFolder.name}' to '${defaultFolder.name}'.`,
          workOrderTitle: archivedRow.title_snapshot,
          fromFolderName: currentFolder.name,
          toFolderName: defaultFolder.name,
        },
      });
    }
  }

  const deleteQuery = archiveSupabase
    .from("archive_folders")
    .delete()
    .eq("id", folderId);
  const { error: deleteError } =
    await deleteQuery.eq("space_id", scope.spaceId);

  if (deleteError) {
    throw toArchiveActionError(deleteError);
  }

  await createArchiveActivityLog({
    supabase: archiveSupabase,
    archiveFolderId: defaultFolder.id,
    action: "folder_deleted",
    actorUserId: user.id,
    metadata: {
      summary: `${user.email ?? "A user"} deleted archive folder '${currentFolder.name}'.`,
      folderName: currentFolder.name,
    },
  });

  revalidatePath("/archive");
  revalidatePath(`/space/${scope.spaceId}/archive`);
  redirect(
    getReturnPath(returnTo, `/space/${scope.spaceId}/archive?folder=${defaultFolder.id}`),
  );
}
