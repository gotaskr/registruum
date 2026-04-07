import { cn } from "@/lib/utils";
import type { WorkOrderStatus } from "@/types/work-order";

type StatusBadgeProps = Readonly<{
  status: WorkOrderStatus;
}>;

const statusClasses: Record<WorkOrderStatus, string> = {
  open: "bg-panel-muted text-muted ring-1 ring-border",
  in_progress: "bg-accent-soft text-accent ring-1 ring-border",
  on_hold: "bg-warning-soft text-warning-text ring-1 ring-border",
  completed: "bg-success-soft text-success-text ring-1 ring-border",
  archived: "bg-panel-muted text-muted ring-1 ring-border",
};

const statusLabels: Record<WorkOrderStatus, string> = {
  open: "Draft",
  in_progress: "In Progress",
  on_hold: "On Hold",
  completed: "Completed",
  archived: "Archived",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none",
        statusClasses[status],
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
