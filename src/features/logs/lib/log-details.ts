export type ParsedLogDetails = Readonly<{
  summary?: string;
  before?: string;
  after?: string;
}>;

function readStringRecordValue(
  value: Record<string, unknown>,
  key: "summary" | "before" | "after",
) {
  const candidate = value[key];
  return typeof candidate === "string" && candidate.trim().length > 0
    ? candidate
    : undefined;
}

export function parseLogDetails(details: unknown): ParsedLogDetails {
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return {};
  }

  const record = details as Record<string, unknown>;

  return {
    summary: readStringRecordValue(record, "summary"),
    before: readStringRecordValue(record, "before"),
    after: readStringRecordValue(record, "after"),
  };
}
