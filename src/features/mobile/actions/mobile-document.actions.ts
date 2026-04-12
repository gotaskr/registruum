"use server";

import { revalidatePath } from "next/cache";
import {
  createWorkOrderLinksAsDocuments,
  uploadWorkOrderFilesAsDocuments,
} from "@/features/documents/api/document-uploads";
import { createActivityLog } from "@/features/logs/api/activity-logs";
import { getLockedWorkOrderMessage } from "@/features/permissions/lib/work-order-permissions";
import { getWorkOrderActorContextForAction } from "@/features/work-orders/api/work-orders";
import {
  createDocumentLinkSchema,
  deleteDocumentSchema,
  uploadDocumentFilesSchema,
} from "@/features/documents/schemas/document.schema";
import {
  initialDocumentActionState,
  type DocumentActionState,
} from "@/features/documents/types/document-action-state";
import { getValidFiles, registruumFilesBucket } from "@/lib/supabase/storage";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function revalidateMobileWorkOrderPaths(spaceId: string, workOrderId: string) {
  revalidatePath(`/space/${spaceId}/work-order/${workOrderId}/documents`);
  revalidatePath(`/space/${spaceId}/work-order/${workOrderId}/chat`);
  revalidatePath(`/m/space/${spaceId}`);
  revalidatePath(`/m/space/${spaceId}/work-order/${workOrderId}/overview`);
  revalidatePath(`/m/space/${spaceId}/work-order/${workOrderId}/documents`);
  revalidatePath(`/m/space/${spaceId}/work-order/${workOrderId}/chat`);
}

function getDocumentLockedMessage(status: Parameters<typeof getLockedWorkOrderMessage>[0]) {
  return (
    getLockedWorkOrderMessage(status) ??
    "You do not have permission to change documents in this work order."
  );
}

export async function uploadMobileWorkOrderDocuments(
  previousState: DocumentActionState = initialDocumentActionState,
  formData: FormData,
): Promise<DocumentActionState> {
  void previousState;
  const parsed = uploadDocumentFilesSchema.safeParse({
    spaceId: readText(formData, "spaceId"),
    workOrderId: readText(formData, "workOrderId"),
  });
  const files = getValidFiles(formData, "files");

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Unable to upload files.",
    };
  }

  if (files.length === 0) {
    return {
      error: "Select at least one file to upload.",
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

  if (!context.permissions.canUploadDocuments) {
    return {
      error: getDocumentLockedMessage(context.workOrder.status),
    };
  }

  try {
    await uploadWorkOrderFilesAsDocuments({
      supabase: context.supabase,
      files,
      spaceId: parsed.data.spaceId,
      workOrderId: parsed.data.workOrderId,
      uploadedByUserId: context.user.id,
      scope: "documents",
      source: "manual",
      sourceSentAt: new Date().toISOString(),
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to upload files.",
    };
  }

  await createActivityLog({
    supabase: context.supabase,
    action: files.length > 1 ? "Uploaded work order documents" : "Uploaded a work order document",
    actorUserId: context.user.id,
    spaceId: parsed.data.spaceId,
    workOrderId: parsed.data.workOrderId,
    entityType: "document",
    entityId: null,
    details: {
      summary: files.length > 1 ? `${files.length} files` : files[0]?.name ?? "Uploaded document",
    },
  });

  revalidateMobileWorkOrderPaths(parsed.data.spaceId, parsed.data.workOrderId);
  return {};
}

export async function createMobileDocumentLink(
  previousState: DocumentActionState = initialDocumentActionState,
  formData: FormData,
): Promise<DocumentActionState> {
  void previousState;
  const parsed = createDocumentLinkSchema.safeParse({
    spaceId: readText(formData, "spaceId"),
    workOrderId: readText(formData, "workOrderId"),
    title: readText(formData, "title"),
    url: readText(formData, "url"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Unable to add link.",
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

  if (!context.permissions.canUploadDocuments) {
    return {
      error: getDocumentLockedMessage(context.workOrder.status),
    };
  }

  try {
    await createWorkOrderLinksAsDocuments({
      supabase: context.supabase,
      links: [{ url: parsed.data.url, title: parsed.data.title }],
      spaceId: parsed.data.spaceId,
      workOrderId: parsed.data.workOrderId,
      uploadedByUserId: context.user.id,
      source: "manual",
      sourceSentAt: new Date().toISOString(),
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to add link.",
    };
  }

  await createActivityLog({
    supabase: context.supabase,
    action: "Added a document link",
    actorUserId: context.user.id,
    spaceId: parsed.data.spaceId,
    workOrderId: parsed.data.workOrderId,
    entityType: "document",
    entityId: null,
    details: {
      summary: parsed.data.title ?? parsed.data.url,
    },
  });

  revalidateMobileWorkOrderPaths(parsed.data.spaceId, parsed.data.workOrderId);
  return {};
}

export async function deleteMobileDocumentItem(
  previousState: DocumentActionState = initialDocumentActionState,
  formData: FormData,
): Promise<DocumentActionState> {
  void previousState;
  const parsed = deleteDocumentSchema.safeParse({
    spaceId: readText(formData, "spaceId"),
    workOrderId: readText(formData, "workOrderId"),
    documentId: readText(formData, "documentId"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Unable to delete document.",
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

  if (!context.permissions.canDeleteDocuments) {
    return {
      error: getDocumentLockedMessage(context.workOrder.status),
    };
  }

  const { data: document, error: documentError } = await context.supabase
    .from("documents")
    .select("id, title, storage_path, document_kind")
    .eq("id", parsed.data.documentId)
    .eq("work_order_id", parsed.data.workOrderId)
    .single();

  if (documentError || !document) {
    return {
      error: "Document item could not be found.",
    };
  }

  if (document.storage_path) {
    const { error: storageError } = await context.supabase.storage
      .from(registruumFilesBucket)
      .remove([document.storage_path]);

    if (storageError) {
      return {
        error: storageError.message,
      };
    }
  }

  const { error: attachmentDeleteError } = await context.supabase
    .from("work_order_message_attachments")
    .delete()
    .eq("document_id", parsed.data.documentId);

  if (attachmentDeleteError) {
    return {
      error: attachmentDeleteError.message,
    };
  }

  const { error: deleteError } = await context.supabase
    .from("documents")
    .delete()
    .eq("id", parsed.data.documentId)
    .eq("work_order_id", parsed.data.workOrderId);

  if (deleteError) {
    return {
      error: deleteError.message,
    };
  }

  await createActivityLog({
    supabase: context.supabase,
    action: "Deleted a document item",
    actorUserId: context.user.id,
    spaceId: parsed.data.spaceId,
    workOrderId: parsed.data.workOrderId,
    entityType: "document",
    entityId: parsed.data.documentId,
    details: {
      summary: `${document.title} (${document.document_kind})`,
    },
  });

  revalidateMobileWorkOrderPaths(parsed.data.spaceId, parsed.data.workOrderId);
  return {};
}
