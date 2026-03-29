"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/modal";
import { FormMessage } from "@/features/auth/ui/form-message";
import { createSpace } from "@/features/spaces/actions/space.actions";
import { initialSpaceActionState } from "@/features/spaces/types/space-action-state";

type CreateSpaceModalProps = Readonly<{
  open: boolean;
  onClose: () => void;
}>;

export function CreateSpaceModal({
  open,
  onClose,
}: CreateSpaceModalProps) {
  const [state, formAction, isPending] = useActionState(
    createSpace,
    initialSpaceActionState,
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Space"
      description="Add a new space to Registruum."
    >
      <form action={formAction} className="space-y-4 px-5 py-4">
        <FormMessage message={state.error} />

        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">Name of Space</span>
          <input
            name="name"
            type="text"
            autoFocus
            className="h-11 w-full rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none"
          />
          {state.fieldErrors?.name ? (
            <p className="text-sm text-rose-700">{state.fieldErrors.name}</p>
          ) : null}
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">Address</span>
          <input
            name="address"
            type="text"
            className="h-11 w-full rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none"
          />
          {state.fieldErrors?.address ? (
            <p className="text-sm text-rose-700">{state.fieldErrors.address}</p>
          ) : null}
          <p className="text-xs text-muted">
            Address is captured in the UI now and will be stored once the space schema adds it.
          </p>
        </label>

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
            className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isPending ? "Creating..." : "Create Space"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
