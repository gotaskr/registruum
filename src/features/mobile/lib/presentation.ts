import type { WorkOrder } from "@/types/work-order";

export function getMobileStatusLabel(status: WorkOrder["status"]) {
  switch (status) {
    case "open":
      return "Draft";
    case "in_progress":
      return "Active";
    case "on_hold":
      return "On Hold";
    case "completed":
      return "Completed";
    case "archived":
      return "Archived";
    default:
      return status;
  }
}

export function getMobileStatusTone(status: WorkOrder["status"]) {
  switch (status) {
    case "in_progress":
      return "active";
    case "completed":
    case "archived":
      return "success";
    case "on_hold":
      return "warning";
    case "open":
    default:
      return "neutral";
  }
}
