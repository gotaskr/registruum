import type { SupabaseClient } from "@supabase/supabase-js";
import { getFormDataFiles } from "@/lib/form-data";
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

/** When `File.type` is empty (common on some mobile pickers), Supabase may treat uploads as disallowed types. */
const extensionContentType: Readonly<Record<string, string>> = {
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  avi: "video/x-msvideo",
  mkv: "video/x-matroska",
  mpeg: "video/mpeg",
  mpg: "video/mpeg",
  m4v: "video/mp4",
  "3gp": "video/3gpp",
};

function fileNameExtension(fileName: string) {
  const normalized = fileName.trim().toLowerCase();
  const dot = normalized.lastIndexOf(".");
  if (dot < 0 || dot === normalized.length - 1) {
    return "";
  }
  return normalized.slice(dot + 1);
}

export function resolveRegistruumFileContentType(file: File) {
  const fromBrowser = file.type?.trim();
  if (fromBrowser) {
    return fromBrowser;
  }
  const ext = fileNameExtension(file.name);
  return extensionContentType[ext] ?? "";
}

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
  return getFormDataFiles(formData, key);
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
  const contentType = resolveRegistruumFileContentType(file);
  if (!contentType) {
    throw new Error(
      "Could not detect file type. Rename the file with a normal extension (e.g. .mp4) and try again.",
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await supabase.storage
    .from(registruumFilesBucket)
    .upload(path, bytes, {
      cacheControl: "3600",
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }
}
