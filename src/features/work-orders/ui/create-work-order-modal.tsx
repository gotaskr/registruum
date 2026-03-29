"use client";

import { Modal } from "@/components/ui/modal";
import { CreateWorkOrderForm } from "@/features/work-orders/ui/create-work-order-form";

type CreateWorkOrderModalProps = Readonly<{
  open: boolean;
  spaceId: string;
  onClose: () => void;
}>;

export function CreateWorkOrderModal({
  open,
  spaceId,
  onClose,
}: CreateWorkOrderModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Work Order"
      description="Add a new work order for this space."
      panelClassName="max-w-2xl"
    >
      <CreateWorkOrderForm spaceId={spaceId} onCancel={onClose} />
    </Modal>
  );
}
