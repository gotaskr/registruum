import type { WorkOrderSubjectType } from "@/types/work-order";

export const workOrderSubjectTypeOptions: ReadonlyArray<{
  value: WorkOrderSubjectType;
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
];

export function getWorkOrderSubjectTypeLabel(value: WorkOrderSubjectType) {
  return (
    workOrderSubjectTypeOptions.find((option) => option.value === value)?.label ??
    "Issue"
  );
}

export function getWorkOrderSubjectTypePlaceholder(value: WorkOrderSubjectType) {
  return (
    workOrderSubjectTypeOptions.find((option) => option.value === value)?.placeholder ??
    "Describe the issue"
  );
}
