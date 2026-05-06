import type { WorkOrderSubjectType } from "@/types/work-order";

export type WorkOrderSubjectTypeOptionValue = WorkOrderSubjectType | "other";

export const workOrderSubjectTypeOptions: ReadonlyArray<{
  value: WorkOrderSubjectTypeOptionValue;
  label: string;
  placeholder: string;
}> = [
  {
    value: "issue",
    label: "Issue",
    placeholder: "Describe the issue",
  },
  {
    value: "maintenance",
    label: "Maintenance",
    placeholder: "Name the maintenance work",
  },
  {
    value: "inspection",
    label: "Inspection",
    placeholder: "Name the inspection",
  },
  {
    value: "project",
    label: "Project",
    placeholder: "Name the project",
  },
  {
    value: "emergency",
    label: "Emergency",
    placeholder: "Describe the emergency",
  },
  {
    value: "other",
    label: "Others",
    placeholder: "Enter custom type",
  },
];

export function getWorkOrderSubjectTypeLabel(value: WorkOrderSubjectTypeOptionValue) {
  return (
    workOrderSubjectTypeOptions.find((option) => option.value === value)?.label ??
    "Issue"
  );
}

export function getWorkOrderSubjectTypePlaceholder(value: WorkOrderSubjectTypeOptionValue) {
  return (
    workOrderSubjectTypeOptions.find((option) => option.value === value)?.placeholder ??
    "Describe the issue"
  );
}
