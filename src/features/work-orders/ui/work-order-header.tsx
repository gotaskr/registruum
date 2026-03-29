import { MapPin } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateLabel, formatWorkOrderLocation } from "@/lib/utils";
import type { WorkOrder } from "@/types/work-order";

type WorkOrderHeaderProps = Readonly<{
  workOrder: WorkOrder;
}>;

export function WorkOrderHeader({ workOrder }: WorkOrderHeaderProps) {
  return (
    <section className="border-b border-border px-6 py-6">
      <div className="max-w-4xl">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">
          {workOrder.title}
        </h2>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <StatusBadge status={workOrder.status} />
          <span className="inline-flex items-center gap-1 text-sm text-muted">
            <MapPin className="h-3.5 w-3.5" />
            {formatWorkOrderLocation(workOrder.locationLabel, workOrder.unitLabel)}
          </span>
          <span className="text-sm text-muted">
            Expires {formatDateLabel(workOrder.expirationAt)}
          </span>
        </div>
      </div>
    </section>
  );
}
