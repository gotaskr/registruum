"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createActivityLog } from "@/features/logs/api/activity-logs";
import { requireAuthenticatedAppUser } from "@/features/auth/api/profiles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  initialArchiveActionState,
  type ArchiveActionState,
} from "@/features/archive/types/archive";
import { getWorkOrderActorContextForAction } from "@/features/work-orders/api/work-orders";
import type { Database } from "@/types/database";

type ArchiveFolderRow = Database["public"]["Tables"]["archive_folders"]["Row"];
type ArchivedWorkOrderRow = Database["public"]["Tables"]["archived_work_orders"]["Row"];
type ServerSupabaseClient = SupabaseClient<Database>;

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readBoolean(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "true" || value === "on";
}

async function getDefaultArchiveFolder() {
  const adminSupabase = createSupabaseAdminClient();
  const { data: existingFolder, error: existingFolderError } = await adminSupabase
    .from("archive_folders")
    .select("*")
    .eq("is_system_default", true)
    .maybeSingle();

  if (existingFolderError) {
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
    throw new Error(createdFolderError.message);
  }

  return createdFolder as ArchiveFolderRow;
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
    throw new Error(error.message);
  }
}

async function getArchiveFolderById(
  supabase: ServerSupabaseClient,
  folderId: string,
) {
  const { data, error } = await supabase
    .from("archive_folders")
    .select("*")
    .eq("id", folderId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ArchiveFolderRow | null) ?? null;
}

async function resolveTargetArchiveFolder(input: Readonly<{
  supabase: ServerSupabaseClient;
  actorUserId: string;
  archiveFolderId: string;
  newFolderName: string;
}>): Promise<ArchiveFolderRow> {
  if (input.newFolderName.length > 0) {
    const { data, error } = await input.supabase
      .from("archive_folders")
      .insert({
        name: input.newFolderName,
        parent_id: null,
        created_by_user_id: input.actorUserId,
        is_system_default: false,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const createdFolder = data as ArchiveFolderRow;
    await createArchiveActivityLog({
      supabase: input.supabase,
      archiveFolderId: createdFolder.id,
      action: "folder_created",
      actorUserId: input.actorUserId,
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
    );

    if (existingFolder) {
      return existingFolder;
    }
  }

  return getDefaultArchiveFolder();
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

  const targetFolder = await resolveTargetArchiveFolder({
    supabase: context.supabase,
    actorUserId: context.user.id,
    archiveFolderId,
    newFolderName,
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

  const { data: archivedRecord, error: archivedRecordError } = await actorSupabase
    .from("archived_work_orders")
    .insert({
      original_work_order_id: workOrderId,
      archive_folder_id: targetFolder.id,
      archived_by_user_id: context.user.id,
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
    supabase: actorSupabase,
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
  revalidatePath(`/space/${spaceId}/work-order/${workOrderId}/overview`);
  revalidatePath(`/space/${spaceId}/work-order/${workOrderId}/settings`);

  redirect(getReturnPath(returnTo, `/archive?folder=${targetFolder.id}`));
}

export async function createArchiveFolderAction(formData: FormData) {
  const { supabase, user } = await requireAuthenticatedAppUser();
  const name = readText(formData, "name");
  const returnTo = readText(formData, "returnTo");

  if (!name) {
    redirect(getReturnPath(returnTo, "/archive"));
  }

  const { data, error } = await supabase
    .from("archive_folders")
    .insert({
      name,
      parent_id: null,
      created_by_user_id: user.id,
      is_system_default: false,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const folder = data as ArchiveFolderRow;

  await createArchiveActivityLog({
    supabase,
    archiveFolderId: folder.id,
    action: "folder_created",
    actorUserId: user.id,
    metadata: {
      summary: `${user.email ?? "A user"} created archive folder '${folder.name}'.`,
      folderName: folder.name,
    },
  });

  revalidatePath("/archive");
  redirect(getReturnPath(returnTo, `/archive?folder=${folder.id}`));
}

export async function renameArchiveFolderAction(formData: FormData) {
  const { supabase, user } = await requireAuthenticatedAppUser();
  const folderId = readText(formData, "folderId");
  const name = readText(formData, "name");
  const returnTo = readText(formData, "returnTo");

  if (!folderId || !name) {
    redirect(getReturnPath(returnTo, "/archive"));
  }

  const currentFolder = await getArchiveFolderById(supabase, folderId);

  if (!currentFolder || currentFolder.is_system_default) {
    redirect(getReturnPath(returnTo, "/archive"));
  }

  const { error } = await supabase
    .from("archive_folders")
    .update({
      name,
    })
    .eq("id", folderId);

  if (error) {
    throw new Error(error.message);
  }

  await createArchiveActivityLog({
    supabase,
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
  redirect(getReturnPath(returnTo, `/archive?folder=${folderId}`));
}

export async function moveArchivedWorkOrderAction(formData: FormData) {
  const archivedWorkOrderId = readText(formData, "archivedWorkOrderId");
  const targetFolderId = readText(formData, "targetFolderId");
  const returnTo = readText(formData, "returnTo");

  if (!archivedWorkOrderId || !targetFolderId) {
    redirect(getReturnPath(returnTo, "/archive"));
  }

  const { supabase } = await requireAuthenticatedAppUser();
  const { data: archivedData, error: archivedError } = await supabase
    .from("archived_work_orders")
    .select("*")
    .eq("id", archivedWorkOrderId)
    .maybeSingle();

  if (archivedError) {
    throw new Error(archivedError.message);
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
    context.supabase,
    archivedRow.archive_folder_id,
  );
  const targetFolder = await getArchiveFolderById(context.supabase, targetFolderId);

  if (!currentFolder || !targetFolder || currentFolder.id === targetFolder.id) {
    redirect(getReturnPath(returnTo, "/archive"));
  }

  const { error: moveError } = await context.supabase
    .from("archived_work_orders")
    .update({
      archive_folder_id: targetFolder.id,
    })
    .eq("id", archivedWorkOrderId);

  if (moveError) {
    throw new Error(moveError.message);
  }

  await createArchiveActivityLog({
    supabase: context.supabase,
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
  redirect(getReturnPath(returnTo, "/archive"));
}

export async function deleteArchiveFolderAction(formData: FormData) {
  const { supabase, user } = await requireAuthenticatedAppUser();
  const folderId = readText(formData, "folderId");
  const forceMoveContents = readBoolean(formData, "forceMoveContents");
  const returnTo = readText(formData, "returnTo");

  if (!folderId) {
    redirect(getReturnPath(returnTo, "/archive"));
  }

  const currentFolder = await getArchiveFolderById(supabase, folderId);

  if (!currentFolder || currentFolder.is_system_default) {
    redirect(getReturnPath(returnTo, "/archive"));
  }

  const defaultFolder = await getDefaultArchiveFolder();
  const { data: archivedData, error: archivedError } = await supabase
    .from("archived_work_orders")
    .select("*")
    .eq("archive_folder_id", folderId);

  if (archivedError) {
    throw new Error(archivedError.message);
  }

  const archivedRows = (archivedData ?? []) as ArchivedWorkOrderRow[];

  if (archivedRows.length > 0 && !forceMoveContents) {
    redirect(getReturnPath(returnTo, `/archive?folder=${folderId}`));
  }

  if (archivedRows.length > 0) {
    const { error: moveError } = await supabase
      .from("archived_work_orders")
      .update({
        archive_folder_id: defaultFolder.id,
      })
      .eq("archive_folder_id", folderId);

    if (moveError) {
      throw new Error(moveError.message);
    }

    for (const archivedRow of archivedRows) {
      await createArchiveActivityLog({
        supabase,
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

  const { error: deleteError } = await supabase
    .from("archive_folders")
    .delete()
    .eq("id", folderId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  await createArchiveActivityLog({
    supabase,
    archiveFolderId: defaultFolder.id,
    action: "folder_deleted",
    actorUserId: user.id,
    metadata: {
      summary: `${user.email ?? "A user"} deleted archive folder '${currentFolder.name}'.`,
      folderName: currentFolder.name,
    },
  });

  revalidatePath("/archive");
  redirect(getReturnPath(returnTo, `/archive?folder=${defaultFolder.id}`));
}
