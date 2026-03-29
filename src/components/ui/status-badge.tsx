import { cn } from "@/lib/utils";
import type { WorkOrderStatus } from "@/types/work-order";

type StatusBadgeProps = Readonly<{
  status: WorkOrderStatus;
}>;

const statusClasses: Record<WorkOrderStatus, string> = {
  open: "bg-[#f3f5f8] text-[#6b778c]",
  in_progress: "bg-[#eef4ff] text-[#356dff]",
  on_hold: "bg-[#fff7e8] text-[#a16207]",
  completed: "bg-[#e9faf3] text-[#0f9f6e]",
  archived: "bg-[#f1f3f7] text-[#8a94a6]",
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
