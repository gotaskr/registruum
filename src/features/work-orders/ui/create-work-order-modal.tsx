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
      panelClassName="max-w-3xl rounded-[2rem] border-[#dbe4f0] bg-[#f8fbff] shadow-[0_24px_60px_rgba(15,23,42,0.14)]"
    >
      <CreateWorkOrderForm spaceId={spaceId} onCancel={onClose} />
    </Modal>
  );
}
