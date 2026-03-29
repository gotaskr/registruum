import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type StorageScope = "documents" | "messages";

type StoragePathInput = Readonly<{
  spaceId: string;
  workOrderId: string;
  scope: StorageScope;
  fileName: string;
  parentId?: string;
}>;

type UploadFileInput = Readonly<{
  supabase: SupabaseClient<Database>;
  path: string;
  file: File;
}>;

export const registruumFilesBucket = "registruum-files";

function sanitizeFileName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9.\-_]/g, "")
    .toLowerCase();
}

export function buildDocumentTitle(fileName: string) {
  const normalized = fileName.trim();
  const extensionIndex = normalized.lastIndexOf(".");

  if (extensionIndex <= 0) {
    return normalized;
  }

  return normalized.slice(0, extensionIndex);
}

export function getValidFiles(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((value): value is File => value instanceof File && value.size > 0);
}

export function buildWorkOrderStoragePath({
  spaceId,
  workOrderId,
  scope,
  fileName,
  parentId,
}: StoragePathInput) {
  const safeName = sanitizeFileName(fileName) || "file";
  const uniqueId = crypto.randomUUID();
  const suffix = parentId ? `${parentId}-${uniqueId}` : uniqueId;

  return [
    "spaces",
    spaceId,
    "work-orders",
    workOrderId,
    scope,
    `${suffix}-${safeName}`,
  ].join("/");
}

export async function uploadFileToStorage({
  supabase,
  path,
  file,
}: UploadFileInput) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await supabase.storage
    .from(registruumFilesBucket)
    .upload(path, bytes, {
      cacheControl: "3600",
      contentType: file.type || undefined,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }
}
