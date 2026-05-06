export function extractMentionTokens(body: string): string[] {
  const matches = body.match(/@([a-zA-Z0-9_]{2,32})/g) ?? [];
  const tokens = new Set<string>();

  for (const match of matches) {
    const value = match.slice(1).trim().toUpperCase();
    if (value) {
      tokens.add(value);
    }
  }

  return [...tokens];
}

export function normalizeMentionTokenToUserTag(token: string): string {
  const normalized = token.trim().toUpperCase();
  return normalized.startsWith("#") ? normalized : `#${normalized}`;
}

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function isMentionBoundary(char: string | undefined) {
  if (!char) {
    return true;
  }
  return /[\s.,!?;:()[\]{}"']/u.test(char);
}

export function collectMentionedUserIdsByName(
  body: string,
  members: ReadonlyArray<{ userId: string; fullName: string | null }>,
): string[] {
  const normalizedBody = body.toLowerCase();
  const ids = new Set<string>();

  for (const member of members) {
    const normalizedFullName = normalizeName(member.fullName ?? "");
    if (!normalizedFullName) {
      continue;
    }

    const needle = `@${normalizedFullName}`;
    let fromIndex = 0;
    while (fromIndex < normalizedBody.length) {
      const index = normalizedBody.indexOf(needle, fromIndex);
      if (index < 0) {
        break;
      }
      const nextChar = normalizedBody[index + needle.length];
      if (isMentionBoundary(nextChar)) {
        ids.add(member.userId);
        break;
      }
      fromIndex = index + needle.length;
    }
  }

  return [...ids];
}
