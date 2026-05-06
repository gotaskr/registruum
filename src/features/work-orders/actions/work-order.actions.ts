"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getWorkOrderCreationBlockedMessage } from "@/features/settings/lib/subscription-enforcement";
import { recordCompletedWorkOrderHistoryForCompletion } from "@/features/history/lib/record-completion-history";
import { createActivityLog } from "@/features/logs/api/activity-logs";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  editableWorkOrderRoles,
  allWorkOrderPermissionKeys,
  createPermissionValues,
  createDefaultWorkOrderPermissionMatrix,
  type WorkOrderPermissionKey,
} from "@/features/permissions/lib/work-order-permission-definitions";
import { getDefaultWorkOrderInviteRole } from "@/features/permissions/lib/roles";
import {
  canChangeWorkOrderStatusTo,
  getLockedWorkOrderMessage,
} from "@/features/permissions/lib/work-order-permissions";
import { uploadWorkOrderFilesAsDocuments } from "@/features/documents/api/document-uploads";
import { inferDocumentKindFromFile } from "@/features/documents/lib/document-system";
import { buildWorkOrderDescription } from "@/features/work-orders/lib/work-order-description";
import { syncSpaceTeamMembersIntoWorkOrder } from "@/features/work-orders/lib/space-team-memberships";
import {
  createWorkOrderSchema,
  updateWorkOrderSchema,
} from "@/features/work-orders/schemas/work-order.schema";
import {
  getSpaceMembershipForAction,
  getWorkOrderActorContextForAction,
} from "@/features/work-orders/api/work-orders";
import {
  initialWorkOrderActionState,
  type WorkOrderActionState,
} from "@/features/work-orders/types/work-order-action-state";
import { DEFAULT_MODULE } from "@/lib/constants";
import { getValidFiles } from "@/lib/supabase/storage";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readBoolean(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "on" || value === "true";
}

function getAssignedMemberIds(formData: FormData) {
  return formData
    .getAll("assignedMemberIds")
    .map((value) => (typeof value === "string" ? value : ""))
    .filter((value) => value.length > 0);
}

function getSafeReturnTo(returnTo: string, fallback: string) {
  return returnTo.startsWith("/") ? returnTo : fallback;
}

function formatStatusLabel(value: "open" | "in_progress" | "on_hold" | "completed" | "archived") {
  if (value === "open") {
    return "Draft";
  }

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildPermissionMatrixFromFormData(formData: FormData) {
  const defaults = createDefaultWorkOrderPermissionMatrix();
  const matrix = Object.fromEntries(
    editableWorkOrderRoles.map((role) => [role, createPermissionValues(defaults[role])]),
  ) as Record<
    (typeof editableWorkOrderRoles)[number],
    Record<WorkOrderPermissionKey, boolean>
  >;

  for (const role of editableWorkOrderRoles) {
    for (const permissionKey of allWorkOrderPermissionKeys) {
      matrix[role][permissionKey] = readBoolean(
        formData,
        `${role}:${permissionKey}`,
      );
    }
  }

  return matrix as ReturnType<typeof createDefaultWorkOrderPermissionMatrix>;
}

function isMissingWorkOrderSettingsColumnError(message: string) {
  return [
    "allow_document_deletion_in_progress",
    "auto_save_chat_attachments",
    "lock_documents_on_completed",
  ].some((columnName) => message.includes(columnName));
}

export type ExecuteCreateWorkOrderResult =
  | { ok: true; spaceId: string; workOrderId: string }
  | { ok: false; error: string };

export async function executeCreateWorkOrder(
  formData: FormData,
): Promise<ExecuteCreateWorkOrderResult> {
  const photoFiles = getValidFiles(formData, "photos");
  const parsed = createWorkOrderSchema.safeParse({
    spaceId: readText(formData, "spaceId"),
    title: readText(formData, "title"),
    subjectType: readText(formData, "subjectType"),
    subject: readText(formData, "subject"),
    locationLabel: readText(formData, "locationLabel"),
    unitLabel: readText(formData, "unitLabel"),
    description: readText(formData, "description"),
    noExpiration: readBoolean(formData, "noExpiration"),
    expirationAt: readText(formData, "expirationAt"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Unable to create work order.",
    };
  }

  if (
    photoFiles.some(
      (file) => inferDocumentKindFromFile(file.name, file.type || null) !== "photo",
    )
  ) {
    return {
      ok: false,
      error: "Only image files can be uploaded as work order photos.",
    };
  }

  const actor = await getSpaceMembershipForAction(parsed.data.spaceId);

  if (!actor) {
    return {
      ok: false,
      error: "You do not have access to this space.",
    };
  }

  if (
    actor.spaceRole !== "admin" &&
    actor.spaceRole !== "operations_manager" &&
    actor.spaceRole !== "manager"
  ) {
    return {
      ok: false,
      error: "Only admins, operations managers, and managers can create work orders.",
    };
  }

  const workOrderLimitMessage = await getWorkOrderCreationBlockedMessage(parsed.data.spaceId);
  if (workOrderLimitMessage) {
    return {
      ok: false,
      error: workOrderLimitMessage,
    };
  }

  const adminSupabase = createSupabaseAdminClient();
  const workOrderId = crypto.randomUUID();
  const expirationAt = parsed.data.noExpiration ? null : parsed.data.expirationAt;
  const { error: createError } = await adminSupabase.from("work_orders").insert({
    id: workOrderId,
    space_id: parsed.data.spaceId,
    created_by_user_id: actor.user.id,
    owner_user_id: actor.user.id,
    title: parsed.data.title,
    subject_type: parsed.data.subjectType,
    subject: parsed.data.subject,
    location_label: parsed.data.locationLabel,
    unit_label: parsed.data.unitLabel,
    description: buildWorkOrderDescription(
      parsed.data.subjectType,
      parsed.data.subject,
      parsed.data.description,
    ),
    priority: "medium",
    due_date: expirationAt,
    expiration_at: expirationAt,
    status: "open",
    is_posted_to_job_market: false,
  });

  if (createError) {
    return {
      ok: false,
      error: createError.message,
    };
  }

  try {
    await syncSpaceTeamMembersIntoWorkOrder({
      supabase: adminSupabase,
      spaceId: parsed.data.spaceId,
      workOrderId,
      assignedByUserId: actor.user.id,
    });
  } catch (error) {
    await adminSupabase.from("work_orders").delete().eq("id", workOrderId);

    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to assign the space team to the new work order.",
    };
  }

  const assignedMemberIds = [...new Set(getAssignedMemberIds(formData))];

  if (assignedMemberIds.length > 0) {
    const { data: existingMemberRows, error: existingMemberError } = await adminSupabase
      .from("work_order_memberships")
      .select("user_id")
      .eq("work_order_id", workOrderId);

    if (existingMemberError) {
      await adminSupabase.from("work_orders").delete().eq("id", workOrderId);

      return {
        ok: false,
        error: existingMemberError.message,
      };
    }

    const existingIds = new Set(
      (existingMemberRows ?? []).map((row) => (row as { user_id: string }).user_id),
    );
    const toAdd = assignedMemberIds.filter((userId) => !existingIds.has(userId));

    if (toAdd.length > 0) {
      const { error: membershipError } = await adminSupabase.from("work_order_memberships").insert(
        toAdd.map((userId) => ({
          work_order_id: workOrderId,
          user_id: userId,
          assigned_by_user_id: actor.user.id,
          role: getDefaultWorkOrderInviteRole(),
        })),
      );

      if (membershipError) {
        await adminSupabase.from("work_orders").delete().eq("id", workOrderId);

        return {
          ok: false,
          error: membershipError.message,
        };
      }
    }
  }

  if (photoFiles.length > 0) {
    try {
      await uploadWorkOrderFilesAsDocuments({
        supabase: adminSupabase,
        files: photoFiles,
        spaceId: parsed.data.spaceId,
        workOrderId,
        uploadedByUserId: actor.user.id,
        scope: "documents",
        source: "manual",
      });
    } catch (error) {
      await adminSupabase.from("work_orders").delete().eq("id", workOrderId);

      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to upload work order photos.",
      };
    }
  }

  await createActivityLog({
    supabase: adminSupabase,
    action: "Created a work order",
    actorUserId: actor.user.id,
    spaceId: parsed.data.spaceId,
    workOrderId,
    entityType: "work_order",
    entityId: workOrderId,
    details: {
      summary: parsed.data.title,
    },
  });

  return {
    ok: true,
    spaceId: parsed.data.spaceId,
    workOrderId,
  };
}

function revalidateWorkOrderSurfaces(spaceId: string, workOrderId: string) {
  revalidatePath(`/space/${spaceId}`);
  revalidatePath(`/space/${spaceId}/work-order/${workOrderId}/${DEFAULT_MODULE}`);
}

export async function createWorkOrder(
  previousState: WorkOrderActionState = initialWorkOrderActionState,
  formData: FormData,
): Promise<WorkOrderActionState> {
  void previousState;
  const result = await executeCreateWorkOrder(formData);

  if (!result.ok) {
    return {
      error: result.error,
    };
  }

  revalidateWorkOrderSurfaces(result.spaceId, result.workOrderId);
  redirect(
    `/space/${result.spaceId}/work-order/${result.workOrderId}/${DEFAULT_MODULE}`,
  );
}

export async function updateWorkOrder(
  previousState: WorkOrderActionState = initialWorkOrderActionState,
  formData: FormData,
): Promise<WorkOrderActionState> {
  void previousState;
  const photoFiles = getValidFiles(formData, "photos");
  const parsed = updateWorkOrderSchema.safeParse({
    workOrderId: readText(formData, "workOrderId"),
    spaceId: readText(formData, "spaceId"),
    title: readText(formData, "title"),
    subjectType: readText(formData, "subjectType"),
    subject: readText(formData, "subject"),
    locationLabel: readText(formData, "locationLabel"),
    unitLabel: readText(formData, "unitLabel"),
    description: readText(formData, "description"),
    priority: readText(formData, "priority"),
    startDate: readText(formData, "startDate"),
    dueDate: readText(formData, "dueDate"),
    status: readText(formData, "status"),
    ownerUserId: readText(formData, "ownerUserId"),
    vendorName: readText(formData, "vendorName"),
    autoSaveChatAttachments: readBoolean(formData, "autoSaveChatAttachments"),
    allowDocumentDeletionInProgress: readBoolean(
      formData,
      "allowDocumentDeletionInProgress",
    ),
    lockDocumentsOnCompleted: readBoolean(formData, "lockDocumentsOnCompleted"),
    editReason: readText(formData, "editReason"),
    isPostedToJobMarket: readBoolean(formData, "isPostedToJobMarket"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Unable to update work order.",
    };
  }

  if (
    photoFiles.some(
      (file) => inferDocumentKindFromFile(file.name, file.type || null) !== "photo",
    )
  ) {
    return {
      error: "Only image files can be uploaded as work order photos.",
    };
  }

  const context = await getWorkOrderActorContextForAction(
    parsed.data.spaceId,
    parsed.data.workOrderId,
  );

  if (!context) {
    return {
      error: "You do not have access to this work order.",
    };
  }

  const returnTo = readText(formData, "returnTo");
  const adminSupabase = createSupabaseAdminClient();
  const actorSupabase = context.supabase;
  const settingsChanged =
    parsed.data.title !== context.workOrder.title ||
    parsed.data.subjectType !== context.workOrder.subjectType ||
    (parsed.data.subject ?? null) !== (context.workOrder.subject ?? null) ||
    (parsed.data.locationLabel ?? null) !== (context.workOrder.locationLabel ?? null) ||
    (parsed.data.unitLabel ?? null) !== (context.workOrder.unitLabel ?? null) ||
    (parsed.data.description ?? null) !== (context.workOrder.description ?? null) ||
    parsed.data.priority !== context.workOrder.priority ||
    (parsed.data.startDate ?? null) !== (context.workOrder.startDate ?? null) ||
    (parsed.data.dueDate ?? null) !==
      (context.workOrder.dueDate ?? context.workOrder.expirationAt ?? null) ||
    (parsed.data.ownerUserId ?? null) !== (context.workOrder.ownerUserId ?? null) ||
    (parsed.data.vendorName ?? null) !== (context.workOrder.vendorName ?? null) ||
    parsed.data.autoSaveChatAttachments !==
      context.workOrder.autoSaveChatAttachments ||
    parsed.data.allowDocumentDeletionInProgress !==
      context.workOrder.allowDocumentDeletionInProgress ||
    parsed.data.lockDocumentsOnCompleted !==
      context.workOrder.lockDocumentsOnCompleted ||
    parsed.data.isPostedToJobMarket !== context.workOrder.isPostedToJobMarket ||
    photoFiles.length > 0;
  const statusChanged = parsed.data.status !== context.workOrder.status;

  if (settingsChanged && !context.permissions.canEditSettings) {
    return {
      error:
        getLockedWorkOrderMessage(context.workOrder.status) ??
        "You cannot edit this work order.",
    };
  }

  if (context.workOrder.status === "completed" && settingsChanged) {
    return {
      error: "Completed work orders are locked. Reopen the work order before editing it.",
    };
  }

  if (
    statusChanged &&
    parsed.data.status === "archived"
  ) {
    return {
      error: "Use the Archive Work Order flow to finalize this record into Archive.",
    };
  }

  if (
    statusChanged &&
    !canChangeWorkOrderStatusTo(
      context.permissions,
      context.workOrder.status,
      parsed.data.status,
    )
  ) {
    return {
      error:
        "You cannot change the lifecycle status for this work order.",
    };
  }

  if (
    (context.workOrder.status === "completed" || context.workOrder.status === "archived") &&
    !parsed.data.editReason
  ) {
    return {
      error: "Provide a reason when editing completed or archived work orders.",
    };
  }

  const baseUpdatePayload = {
    title: parsed.data.title,
    subject_type: parsed.data.subjectType,
    subject: parsed.data.subject,
    location_label: parsed.data.locationLabel,
    unit_label: parsed.data.unitLabel,
    description: buildWorkOrderDescription(
      parsed.data.subjectType,
      parsed.data.subject,
      parsed.data.description,
    ),
    priority: parsed.data.priority,
    start_date: parsed.data.startDate,
    due_date: parsed.data.dueDate,
    expiration_at: parsed.data.dueDate,
    owner_user_id: parsed.data.ownerUserId,
    vendor_name: parsed.data.vendorName,
    status: parsed.data.status,
    is_posted_to_job_market: parsed.data.isPostedToJobMarket,
  };

  const documentRulesPayload = {
    auto_save_chat_attachments: parsed.data.autoSaveChatAttachments,
    allow_document_deletion_in_progress: parsed.data.allowDocumentDeletionInProgress,
    lock_documents_on_completed: parsed.data.lockDocumentsOnCompleted,
  };

  let updateError: { message: string } | null = null;

  {
    const result = await actorSupabase
      .from("work_orders")
      .update({
        ...baseUpdatePayload,
        ...documentRulesPayload,
      })
      .eq("id", parsed.data.workOrderId)
      .eq("space_id", parsed.data.spaceId);

    updateError = result.error;
  }

  if (updateError && isMissingWorkOrderSettingsColumnError(updateError.message)) {
    const fallbackResult = await actorSupabase
      .from("work_orders")
      .update(baseUpdatePayload)
      .eq("id", parsed.data.workOrderId)
      .eq("space_id", parsed.data.spaceId);

    updateError = fallbackResult.error;
  }

  if (updateError) {
    return {
      error: updateError.message,
    };
  }

  if (photoFiles.length > 0) {
    try {
      await uploadWorkOrderFilesAsDocuments({
        supabase: adminSupabase,
        files: photoFiles,
        spaceId: parsed.data.spaceId,
        workOrderId: parsed.data.workOrderId,
        uploadedByUserId: context.user.id,
        scope: "documents",
        source: "manual",
      });
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unable to upload work order photos.",
      };
    }
  }

  const ownerChanged = parsed.data.ownerUserId !== context.workOrder.ownerUserId;
  const settingsSummary = [
    parsed.data.title,
    ownerChanged ? "Owner updated" : null,
    parsed.data.priority !== context.workOrder.priority ? `Priority: ${parsed.data.priority}` : null,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" / ");

  await createActivityLog({
    supabase: adminSupabase,
    action: statusChanged ? "Updated work order status" : "Updated work order settings",
    actorUserId: context.user.id,
    spaceId: parsed.data.spaceId,
    workOrderId: parsed.data.workOrderId,
    entityType: "work_order",
    entityId: parsed.data.workOrderId,
    details: {
      summary: statusChanged ? formatStatusLabel(parsed.data.status) : settingsSummary,
      before: statusChanged ? formatStatusLabel(context.workOrder.status) : undefined,
      after: statusChanged ? formatStatusLabel(parsed.data.status) : undefined,
    },
  });

  if (parsed.data.editReason) {
    await createActivityLog({
      supabase: adminSupabase,
      action: "Recorded a protected work order edit reason",
      actorUserId: context.user.id,
      spaceId: parsed.data.spaceId,
      workOrderId: parsed.data.workOrderId,
      entityType: "work_order",
      entityId: parsed.data.workOrderId,
      details: {
        summary: parsed.data.editReason,
      },
    });
  }

  revalidateWorkOrderSurfaces(parsed.data.spaceId, parsed.data.workOrderId);

  if (returnTo.startsWith(`/space/${parsed.data.spaceId}/`)) {
    redirect(returnTo);
  }

  redirect(`/space/${parsed.data.spaceId}/work-order/${parsed.data.workOrderId}/settings`);
}

export async function completeWorkOrder(
  previousState: WorkOrderActionState = initialWorkOrderActionState,
  formData: FormData,
): Promise<WorkOrderActionState> {
  void previousState;
  const workOrderId = readText(formData, "workOrderId");
  const spaceId = readText(formData, "spaceId");
  const returnTo = readText(formData, "returnTo");

  const context = await getWorkOrderActorContextForAction(spaceId, workOrderId);

  if (!context) {
    return {
      error: "You do not have access to this work order.",
    };
  }

  if (context.workOrder.status === "completed") {
    redirect(getSafeReturnTo(returnTo, `/space/${spaceId}`));
  }

  if (context.workOrder.status === "archived") {
    return {
      error: "Archived work orders cannot be completed again.",
    };
  }

  if (
    !canChangeWorkOrderStatusTo(
      context.permissions,
      context.workOrder.status,
      "completed",
    )
  ) {
    return {
      error: "You do not have permission to complete this work order.",
    };
  }

  const { error } = await context.supabase
    .from("work_orders")
    .update({
      status: "completed",
    })
    .eq("id", workOrderId)
    .eq("space_id", spaceId);

  if (error) {
    return {
      error: error.message,
    };
  }

  const adminSupabase = createSupabaseAdminClient();
  await createActivityLog({
    supabase: adminSupabase,
    action: "Completed work order",
    actorUserId: context.user.id,
    spaceId,
    workOrderId,
    entityType: "work_order",
    entityId: workOrderId,
    details: {
      summary: context.workOrder.title,
      before: formatStatusLabel(context.workOrder.status),
      after: "Completed",
    },
  });

  try {
    await recordCompletedWorkOrderHistoryForCompletion({
      spaceId,
      workOrderId,
      completedAtIso: new Date().toISOString(),
      workOrderTitle: context.workOrder.title,
      ownerUserId: context.workOrder.ownerUserId,
    });
  } catch (historyError) {
    console.error("Failed to record completed work order history:", historyError);
  }

  revalidatePath(`/space/${spaceId}`);
  revalidatePath("/history");
  revalidatePath(`/space/${spaceId}/work-order/${workOrderId}/overview`);
  revalidatePath(`/space/${spaceId}/work-order/${workOrderId}/chat`);
  revalidatePath(`/space/${spaceId}/work-order/${workOrderId}/documents`);
  revalidatePath(`/space/${spaceId}/work-order/${workOrderId}/members`);
  revalidatePath(`/space/${spaceId}/work-order/${workOrderId}/logs`);
  revalidatePath(`/space/${spaceId}/work-order/${workOrderId}/settings`);

  redirect(getSafeReturnTo(returnTo, `/space/${spaceId}`));
}

export async function setWorkOrderLifecycleStatus(
  previousState: WorkOrderActionState = initialWorkOrderActionState,
  formData: FormData,
): Promise<WorkOrderActionState> {
  void previousState;
  const workOrderId = readText(formData, "workOrderId");
  const spaceId = readText(formData, "spaceId");
  const returnTo = readText(formData, "returnTo");
  const nextStatus = readText(formData, "status");

  if (
    nextStatus !== "open" &&
    nextStatus !== "in_progress" &&
    nextStatus !== "on_hold"
  ) {
    return {
      error: "Unsupported status update.",
    };
  }

  const context = await getWorkOrderActorContextForAction(spaceId, workOrderId);

  if (!context) {
    return {
      error: "You do not have access to this work order.",
    };
  }

  if (
    !canChangeWorkOrderStatusTo(
      context.permissions,
      context.workOrder.status,
      nextStatus,
    )
  ) {
    return {
      error:
        getLockedWorkOrderMessage(context.workOrder.status) ??
        "You do not have permission to update this work order status.",
    };
  }

  const { error } = await context.supabase
    .from("work_orders")
    .update({ status: nextStatus })
    .eq("id", workOrderId)
    .eq("space_id", spaceId);

  if (error) {
    return {
      error: error.message,
    };
  }

  const adminSupabase = createSupabaseAdminClient();
  await createActivityLog({
    supabase: adminSupabase,
    action: "Updated work order status",
    actorUserId: context.user.id,
    spaceId,
    workOrderId,
    entityType: "work_order",
    entityId: workOrderId,
    details: {
      summary: context.workOrder.title,
      before: formatStatusLabel(context.workOrder.status),
      after: formatStatusLabel(nextStatus),
    },
  });

  revalidateWorkOrderSurfaces(spaceId, workOrderId);
  redirect(getSafeReturnTo(returnTo, `/space/${spaceId}`));
}

export async function deleteWorkOrder(
  previousState: WorkOrderActionState = initialWorkOrderActionState,
  formData: FormData,
): Promise<WorkOrderActionState> {
  void previousState;
  const workOrderId = readText(formData, "workOrderId");
  const spaceId = readText(formData, "spaceId");

  const context = await getWorkOrderActorContextForAction(spaceId, workOrderId);

  if (!context) {
    return {
      error: "You do not have access to this work order.",
    };
  }

  if (!context.permissions.canDeleteWorkOrder) {
    return {
      error:
        getLockedWorkOrderMessage(context.workOrder.status) ??
        "You cannot delete this work order.",
    };
  }

  const adminSupabase = createSupabaseAdminClient();

  await createActivityLog({
    supabase: adminSupabase,
    action: "Deleted a work order",
    actorUserId: context.user.id,
    spaceId,
    workOrderId,
    entityType: "work_order",
    entityId: workOrderId,
    details: {
      summary: context.workOrder.title,
    },
  });

  const { error } = await adminSupabase
    .from("work_orders")
    .delete()
    .eq("id", workOrderId)
    .eq("space_id", spaceId);

  if (error) {
    return {
      error: error.message,
    };
  }

  revalidatePath(`/space/${spaceId}`);
  redirect(`/space/${spaceId}`);
}

export async function saveWorkOrderPermissions(
  previousState: WorkOrderActionState = initialWorkOrderActionState,
  formData: FormData,
): Promise<WorkOrderActionState> {
  void previousState;
  const workOrderId = readText(formData, "workOrderId");
  const spaceId = readText(formData, "spaceId");
  const context = await getWorkOrderActorContextForAction(spaceId, workOrderId);

  if (!context) {
    return {
      error: "You do not have access to this work order.",
    };
  }

  if (!context.permissions.canManagePermissions) {
    return {
      error: "You do not have permission to manage work order permissions.",
    };
  }

  const nextMatrix = buildPermissionMatrixFromFormData(formData);
  const adminSupabase = createSupabaseAdminClient();
  const rows = editableWorkOrderRoles
    .filter((role) => role !== "admin")
    .flatMap((role) =>
    allWorkOrderPermissionKeys.map((permissionKey) => ({
      work_order_id: workOrderId,
      role,
      permission_key: permissionKey,
      is_allowed: nextMatrix[role][permissionKey],
    })),
  );

  const { error } = await adminSupabase
    .from("work_order_role_permissions")
    .upsert(rows, {
      onConflict: "work_order_id,role,permission_key",
    });

  if (error) {
    return {
      error: error.message,
    };
  }

  await createActivityLog({
    supabase: adminSupabase,
    action: "Updated work order permissions",
    actorUserId: context.user.id,
    spaceId,
    workOrderId,
    entityType: "work_order",
    entityId: workOrderId,
    details: {
      summary: "Saved role permission changes for the active work order roles. Admin remains full control.",
    },
  });

  revalidatePath(`/space/${spaceId}/work-order/${workOrderId}/settings`);

  return {
    success: "Permissions updated.",
  };
}
