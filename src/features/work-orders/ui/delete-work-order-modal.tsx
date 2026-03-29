"use client";

import { useActionState } from "react";
import { FormMessage } from "@/features/auth/ui/form-message";
import { Modal } from "@/components/ui/modal";
import { deleteWorkOrder } from "@/features/work-orders/actions/work-order.actions";
import {
  initialWorkOrderActionState,
} from "@/features/work-orders/types/work-order-action-state";
import type { WorkOrder } from "@/types/work-order";

type DeleteWorkOrderModalProps = Readonly<{
  open: boolean;
  workOrder: WorkOrder;
  onClose: () => void;
}>;

export function DeleteWorkOrderModal({
  open,
  workOrder,
  onClose,
}: DeleteWorkOrderModalProps) {
  const [state, formAction, isPending] = useActionState(
    deleteWorkOrder,
    initialWorkOrderActionState,
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Delete Work Order"
      description="This will remove the work order and its active assignments from this space."
      panelClassName="max-w-lg"
    >
      <form action={formAction} className="space-y-4 px-5 py-4">
        <input type="hidden" name="workOrderId" value={workOrder.id} />
        <input type="hidden" name="spaceId" value={workOrder.spaceId} />
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="font-medium text-red-800">{workOrder.title}</p>
          <p className="mt-1">Delete this work order only if you no longer need its active record.</p>
        </div>
        <FormMessage message={state.error} tone="error" />
        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-panel px-4 text-sm font-medium text-foreground disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-red-200 bg-red-600 px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isPending ? "Deleting..." : "Delete Work Order"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
