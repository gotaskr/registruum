"use client";

import { Modal } from "@/components/ui/modal";
import { getWorkOrderAssignmentRoleHelpSummaries } from "@/features/members/lib/work-order-role-help-summaries";

type WorkOrderRolesHelpModalProps = Readonly<{
  open: boolean;
  onClose: () => void;
}>;

const summaries = getWorkOrderAssignmentRoleHelpSummaries();

export function WorkOrderRolesHelpModal({ open, onClose }: WorkOrderRolesHelpModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="What can each work order role do?"
      description="These are the assignment roles used only on this work order. They are separate from space teammates like Admin or Manager. By default, assignment roles cannot change work order status or delete the work order; only Officer / Coordinator and Contractor can invite people to the work order. An admin can adjust per-role permissions in work order settings."
      panelClassName="max-w-lg lg:max-w-xl"
      bottomSheetOnNarrow
      contentClassName="max-h-[min(70dvh,32rem)] overflow-y-auto px-4 pb-5 pt-1 sm:px-5 sm:pb-6"
    >
      <div className="space-y-6">
        {summaries.map((entry) => (
          <section key={entry.role} className="border-b border-border pb-5 last:border-b-0 last:pb-0">
            <h3 className="text-sm font-semibold text-foreground">{entry.title}</h3>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {entry.bullets.map((line, index) => (
                <li key={`${entry.role}-${index}`}>{line}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Modal>
  );
}
