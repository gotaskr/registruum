export const spacePhotoBucket = "space-photos";

function sanitizeFileName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9.\-_]/g, "")
    .toLowerCase();
}

export function buildSpacePhotoPath(spaceId: string, fileName: string) {
  const safeFileName = sanitizeFileName(fileName) || "space-photo";
  return `spaces/${spaceId}/photo/${crypto.randomUUID()}-${safeFileName}`;
}
