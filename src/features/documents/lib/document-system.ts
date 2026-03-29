import type {
  SystemDocumentFolderKey,
  WorkOrderDocumentKind,
} from "@/features/documents/types/document-browser";

export const systemDocumentFolders: ReadonlyArray<{
  key: SystemDocumentFolderKey;
  name: string;
}> = [
  { key: "photos", name: "Photos" },
  { key: "videos", name: "Videos" },
  { key: "files", name: "Files" },
  { key: "links", name: "Links" },
];

const photoExtensions = new Set([
  "gif",
  "heic",
  "heif",
  "jpeg",
  "jpg",
  "png",
  "webp",
]);

const videoExtensions = new Set([
  "avi",
  "mkv",
  "mov",
  "mp4",
  "mpeg",
  "mpg",
  "webm",
]);

function getFileExtension(fileName: string) {
  const normalized = fileName.trim().toLowerCase();
  const dotIndex = normalized.lastIndexOf(".");

  if (dotIndex < 0 || dotIndex === normalized.length - 1) {
    return "";
  }

  return normalized.slice(dotIndex + 1);
}

export function getSystemFolderId(key: SystemDocumentFolderKey) {
  return `system:${key}`;
}

export function getSystemFolderKeyForDocumentKind(
  kind: WorkOrderDocumentKind,
): SystemDocumentFolderKey {
  switch (kind) {
    case "photo":
      return "photos";
    case "video":
      return "videos";
    case "link":
      return "links";
    default:
      return "files";
  }
}

export function inferDocumentKindFromFile(
  fileName: string,
  mimeType: string | null,
): WorkOrderDocumentKind {
  if (mimeType?.startsWith("image/")) {
    return "photo";
  }

  if (mimeType?.startsWith("video/")) {
    return "video";
  }

  const extension = getFileExtension(fileName);

  if (photoExtensions.has(extension)) {
    return "photo";
  }

  if (videoExtensions.has(extension)) {
    return "video";
  }

  return "file";
}

export function extractUniqueUrlsFromText(value: string) {
  const matches = value.match(/https?:\/\/[^\s]+/gi) ?? [];
  const urls: string[] = [];
  const seen = new Set<string>();

  for (const match of matches) {
    try {
      const url = new URL(match);
      const normalized = url.toString();

      if (!seen.has(normalized)) {
        seen.add(normalized);
        urls.push(normalized);
      }
    } catch {
      continue;
    }
  }

  return urls;
}

export function buildLinkTitle(urlValue: string) {
  try {
    const url = new URL(urlValue);
    return url.hostname.replace(/^www\./, "") || urlValue;
  } catch {
    return urlValue;
  }
}
