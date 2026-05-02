"use client";

import { useActionState, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { completeWorkOrder } from "@/features/work-orders/actions/work-order.actions";
import {
  initialWorkOrderActionState,
} from "@/features/work-orders/types/work-order-action-state";
import { cn } from "@/lib/utils";

type WorkOrderSidebarCompleteActionProps = Readonly<{
  workOrderId: string;
  spaceId: string;
  workOrderTitle: string;
  returnTo: string;
  buttonClassName?: string;
}>;

export function WorkOrderSidebarCompleteAction({
  workOrderId,
  spaceId,
  workOrderTitle,
  returnTo,
  buttonClassName,
}: WorkOrderSidebarCompleteActionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    completeWorkOrder,
    initialWorkOrderActionState,
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          "inline-flex h-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100",
          buttonClassName,
        )}
      >
        Mark as complete
      </button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Mark work order as complete"
        description="This confirms the work order is finished."
      >
        <form action={formAction} className="space-y-4 px-5 py-4">
          <input type="hidden" name="workOrderId" value={workOrderId} />
          <input type="hidden" name="spaceId" value={spaceId} />
          <input type="hidden" name="returnTo" value={returnTo} />

          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-amber-800">{workOrderTitle}</p>
                <p className="mt-2 text-sm leading-6 text-amber-700">
                  When a work order is marked complete, users can no longer edit or make changes to it.
                </p>
              </div>
            </div>
          </div>

          {state.error ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {state.error}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-panel px-4 text-sm font-medium text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Completing..." : "Mark as complete"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
