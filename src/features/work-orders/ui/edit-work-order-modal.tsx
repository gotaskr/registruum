"use client";

import { Modal } from "@/components/ui/modal";
import { UpdateWorkOrderForm } from "@/features/work-orders/ui/update-work-order-form";
import { getLockedWorkOrderMessage } from "@/features/permissions/lib/work-order-permissions";
import type { SpaceMembershipRole } from "@/types/database";
import type { WorkOrder } from "@/types/work-order";

type EditWorkOrderModalProps = Readonly<{
  open: boolean;
  workOrder: WorkOrder;
  actorRole: SpaceMembershipRole;
  canEdit: boolean;
  returnTo: string;
  onClose: () => void;
}>;

export function EditWorkOrderModal({
  open,
  workOrder,
  actorRole,
  canEdit,
  returnTo,
  onClose,
}: EditWorkOrderModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Work Order"
      description="Update the core details for this work order."
      panelClassName="max-w-2xl"
    >
      <UpdateWorkOrderForm
        workOrder={workOrder}
        canEdit={canEdit}
        lockedMessage={getLockedWorkOrderMessage(workOrder.status)}
        actorRole={actorRole}
        returnTo={returnTo}
        onCancel={onClose}
        submitLabel="Save Changes"
      />
    </Modal>
  );
}
