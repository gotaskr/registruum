import { StatusBadge } from "@/components/ui/status-badge";
import type { WorkOrderStatus } from "@/types/work-order";

type ChatHeaderProps = Readonly<{
  workOrderName: string;
  status: WorkOrderStatus;
  memberCount: number;
}>;

export function ChatHeader({
  workOrderName,
  status,
  memberCount,
}: ChatHeaderProps) {
  return (
    <header className="border-b border-border px-6 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold text-foreground">{workOrderName}</h2>
        <StatusBadge status={status} />
        <p className="text-sm text-muted">
          {memberCount} {memberCount === 1 ? "member" : "members"}
        </p>
      </div>
    </header>
  );
}
