import type { WorkOrderSubjectType } from "@/types/work-order";

export type WorkOrderDescriptionParts = Readonly<{
  subjectType: WorkOrderSubjectType;
  subject: string;
  description: string;
}>;

export function buildWorkOrderDescription(
  subjectType: WorkOrderSubjectType,
  subject: string | null,
  description: string | null,
) {
  void subjectType;
  void subject;
  return description;
}

export function splitWorkOrderDescription(
  value: string | null | undefined,
  persistedSubjectType?: WorkOrderSubjectType | null,
  persistedSubject?: string | null,
): WorkOrderDescriptionParts {
  const normalized = value?.trim() ?? "";

  if (persistedSubjectType || persistedSubject) {
    return {
      subjectType: persistedSubjectType ?? "issue",
      subject: persistedSubject ?? "",
      description: normalized,
    };
  }

  if (!normalized) {
    return {
      subjectType: "issue",
      subject: "",
      description: "",
    };
  }

  const firstLine = normalized.split("\n")[0] ?? "";
  const matchedLabel = firstLine.match(
    /^(Issue|Maintenance|Inspection|Project|Emergency):\s*/,
  );

  if (!matchedLabel) {
    return {
      subjectType: "issue",
      subject: "",
      description: normalized,
    };
  }

  const [, rawLabel] = matchedLabel;
  const [, ...restLines] = normalized.split("\n");
  const subjectType =
    rawLabel === "Maintenance"
      ? "maintenance"
      : rawLabel === "Inspection"
        ? "inspection"
        : rawLabel === "Project"
          ? "project"
          : rawLabel === "Emergency"
            ? "emergency"
            : "issue";
  const subject = firstLine
    .replace(/^(Issue|Maintenance|Inspection|Project|Emergency):\s*/, "")
    .trim();
  const description = restLines.join("\n").replace(/^\s+/, "").trim();

  return {
    subjectType,
    subject,
    description,
  };
}
