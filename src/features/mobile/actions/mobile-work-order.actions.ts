"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { uploadWorkOrderFilesAsDocuments } from "@/features/documents/api/document-uploads";
import { inferDocumentKindFromFile } from "@/features/documents/lib/document-system";
import { createActivityLog } from "@/features/logs/api/activity-logs";
import { getLockedWorkOrderMessage } from "@/features/permissions/lib/work-order-permissions";
import {
  getSpaceMembershipForAction,
  getWorkOrderActorContextForAction,
} from "@/features/work-orders/api/work-orders";
import { buildWorkOrderDescription } from "@/features/work-orders/lib/work-order-description";
import { createWorkOrderSchema } from "@/features/work-orders/schemas/work-order.schema";
import {
  initialWorkOrderActionState,
  type WorkOrderActionState,
} from "@/features/work-orders/types/work-order-action-state";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getValidFiles } from "@/lib/supabase/storage";
import { getDefaultWorkOrderInviteRole } from "@/features/permissions/lib/roles";

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

function getSafeMobileReturnTo(returnTo: string, fallback: string) {
  return returnTo.startsWith("/m/") ? returnTo : fallback;
}

function formatStatusLabel(
  value: "open" | "in_progress" | "completed" | "archived" | "on_hold",
) {
  if (value === "open") {
    return "Active";
  }

  if (value === "in_progress") {
    return "In Progress";
  }

  if (value === "on_hold") {
    return "On Hold";
  }

  if (value === "archived") {
    return "Archived";
  }

  return "Completed";
}

export async function createMobileWorkOrder(
  previousState: WorkOrderActionState = initialWorkOrderActionState,
  formData: FormData,
): Promise<WorkOrderActionState> {
  void previousState;
  const photoFiles = getValidFiles(formData, "photos");
  const parsed = createWorkOrderSchema.safeParse({
    spaceId: readText(formData, "spaceId"),
    title: readText(formData, "title"),
    subjectType: readText(formData, "subjectType"),
    subject: readText(formData, "subject"),
    locationLabel: readText(formData, "locationLabel"),
    unitLabel: "",
    description: readText(formData, "description"),
    expirationAt: readText(formData, "expirationAt"),
    isPostedToJobMarket: readBoolean(formData, "isPostedToJobMarket"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Unable to create work order.",
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

  const actor = await getSpaceMembershipForAction(parsed.data.spaceId);

  if (
    !actor ||
    (actor.spaceRole !== "admin" &&
      actor.spaceRole !== "operations_manager" &&
      actor.spaceRole !== "manager")
  ) {
    return {
      error: "Only admins, operations managers, and managers can create work orders.",
    };
  }

  const assignedMemberIds = [...new Set(getAssignedMemberIds(formData))];
  const adminSupabase = createSupabaseAdminClient();
  const workOrderId = crypto.randomUUID();
  const { error: createError } = await adminSupabase.from("work_orders").insert({
    id: workOrderId,
    space_id: parsed.data.spaceId,
    created_by_user_id: actor.user.id,
    owner_user_id: actor.user.id,
    title: parsed.data.title,
    subject_type: parsed.data.subjectType,
    subject: parsed.data.subject,
    location_label: parsed.data.locationLabel,
    unit_label: "",
    description: buildWorkOrderDescription(
      parsed.data.subjectType,
      parsed.data.subject,
      parsed.data.description,
    ),
    priority: "medium",
    due_date: parsed.data.expirationAt,
    expiration_at: parsed.data.expirationAt,
    status: "open",
    is_posted_to_job_market: parsed.data.isPostedToJobMarket,
  });

  if (createError) {
    return {
      error: createError.message,
    };
  }

  if (assignedMemberIds.length > 0) {
    const { error: membershipError } = await adminSupabase
      .from("work_order_memberships")
      .insert(
        assignedMemberIds.map((userId) => ({
          work_order_id: workOrderId,
          user_id: userId,
          assigned_by_user_id: actor.user.id,
          role: getDefaultWorkOrderInviteRole(),
        })),
      );

    if (membershipError) {
      await adminSupabase.from("work_orders").delete().eq("id", workOrderId);
      return {
        error: membershipError.message,
      };
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

  revalidatePath("/");
  revalidatePath(`/space/${parsed.data.spaceId}`);
  revalidatePath(`/m`);
  revalidatePath(`/m/spaces`);
  revalidatePath(`/m/space/${parsed.data.spaceId}`);
  redirect(`/m/space/${parsed.data.spaceId}/work-order/${workOrderId}/overview`);
}

export async function completeMobileWorkOrder(
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

  if (!context.permissions.canChangeLifecycleStatus) {
    return {
      error:
        getLockedWorkOrderMessage(context.workOrder.status) ??
        "You do not have permission to complete this work order.",
    };
  }

  const { error } = await context.supabase
    .from("work_orders")
    .update({ status: "completed" })
    .eq("id", workOrderId)
    .eq("space_id", spaceId);

  if (error) {
    return {
      error: error.message,
    };
  }

  await createActivityLog({
    supabase: context.supabase,
    action: "Completed work order",
    actorUserId: context.user.id,
    spaceId,
    workOrderId,
    entityType: "work_order",
    entityId: workOrderId,
    details: {
      summary: context.workOrder.title,
      after: "Completed",
    },
  });

  revalidatePath(`/space/${spaceId}`);
  revalidatePath(`/m`);
  revalidatePath(`/m/spaces`);
  revalidatePath(`/m/space/${spaceId}`);
  revalidatePath(`/m/space/${spaceId}/work-order/${workOrderId}/overview`);
  redirect(getSafeMobileReturnTo(returnTo, `/m/space/${spaceId}`));
}

export async function setMobileWorkOrderStatus(
  previousState: WorkOrderActionState = initialWorkOrderActionState,
  formData: FormData,
): Promise<WorkOrderActionState> {
  void previousState;
  const workOrderId = readText(formData, "workOrderId");
  const spaceId = readText(formData, "spaceId");
  const returnTo = readText(formData, "returnTo");
  const nextStatus = readText(formData, "status");

  if (nextStatus !== "open" && nextStatus !== "in_progress") {
    return {
      error: "Unsupported mobile status update.",
    };
  }

  const context = await getWorkOrderActorContextForAction(spaceId, workOrderId);

  if (!context) {
    return {
      error: "You do not have access to this work order.",
    };
  }

  if (!context.permissions.canChangeLifecycleStatus) {
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

  await createActivityLog({
    supabase: context.supabase,
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

  revalidatePath(`/space/${spaceId}`);
  revalidatePath(`/m`);
  revalidatePath(`/m/spaces`);
  revalidatePath(`/m/space/${spaceId}`);
  revalidatePath(`/m/space/${spaceId}/work-order/${workOrderId}/overview`);
  revalidatePath(`/m/space/${spaceId}/work-order/${workOrderId}/chat`);
  revalidatePath(`/m/space/${spaceId}/work-order/${workOrderId}/documents`);
  revalidatePath(`/m/space/${spaceId}/work-order/${workOrderId}/logs`);
  redirect(getSafeMobileReturnTo(returnTo, `/m/space/${spaceId}`));
}
