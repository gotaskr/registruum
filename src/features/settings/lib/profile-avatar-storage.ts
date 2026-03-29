export const profileAvatarBucket = "profile-avatars";

function sanitizeFileName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9.\-_]/g, "")
    .toLowerCase();
}

export function buildProfileAvatarPath(profileId: string, fileName: string) {
  const safeFileName = sanitizeFileName(fileName) || "avatar";
  return `profiles/${profileId}/avatar/${crypto.randomUUID()}-${safeFileName}`;
}
