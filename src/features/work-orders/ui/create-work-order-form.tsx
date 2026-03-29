"use client";

import { useActionState, useState } from "react";
import { FileUploadField } from "@/components/ui/file-upload-field";
import { FormMessage } from "@/features/auth/ui/form-message";
import { createWorkOrder } from "@/features/work-orders/actions/work-order.actions";
import {
  getWorkOrderSubjectTypeLabel,
  getWorkOrderSubjectTypePlaceholder,
  workOrderSubjectTypeOptions,
} from "@/features/work-orders/lib/work-order-subject-types";
import { initialWorkOrderActionState } from "@/features/work-orders/types/work-order-action-state";
import type { WorkOrderSubjectType } from "@/types/work-order";

type CreateWorkOrderFormProps = Readonly<{
  spaceId: string;
  onCancel?: () => void;
}>;

export function CreateWorkOrderForm({
  spaceId,
  onCancel,
}: CreateWorkOrderFormProps) {
  const [subjectType, setSubjectType] = useState<WorkOrderSubjectType>("issue");
  const [state, formAction, isPending] = useActionState(
    createWorkOrder,
    initialWorkOrderActionState,
  );
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="space-y-4 px-5 py-4">
      <input type="hidden" name="spaceId" value={spaceId} />
      <div>
        <p className="text-sm font-semibold text-foreground">Create Work Order</p>
        <p className="mt-1 text-sm text-muted">
          Add a new work order for this space.
        </p>
      </div>
      <FormMessage message={state.error} />
      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">Name of Work Order</span>
        <input
          name="title"
          type="text"
          className="h-11 w-full rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none"
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">Type</span>
        <select
          name="subjectType"
          value={subjectType}
          onChange={(event) => setSubjectType(event.target.value as WorkOrderSubjectType)}
          className="h-11 w-full rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none"
        >
          {workOrderSubjectTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">
          {getWorkOrderSubjectTypeLabel(subjectType)}
        </span>
        <input
          name="subject"
          type="text"
          placeholder={getWorkOrderSubjectTypePlaceholder(subjectType)}
          className="h-11 w-full rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none"
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">Location</span>
        <input
          name="locationLabel"
          type="text"
          placeholder="Facility or unit"
          className="h-11 w-full rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none"
        />
      </label>
      <input type="hidden" name="unitLabel" value="" />
      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">Description</span>
        <textarea
          name="description"
          rows={4}
          className="w-full rounded-lg border border-border bg-panel px-3 py-3 text-sm text-foreground outline-none"
        />
      </label>
      <div className="space-y-2">
        <span className="text-sm font-medium text-foreground">Upload Photos</span>
        <FileUploadField
          name="photos"
          buttonLabel="Upload Photos"
          accept=".jpg,.jpeg,.png,.webp,.gif,.heic,.heif"
          helperText="You can upload multiple photos. They will appear in the work order overview and documents."
        />
      </div>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">Expiration Date</span>
          <input
            name="expirationAt"
            type="date"
            min={today}
            className="h-11 w-full rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none"
          />
        </label>
        <label className="flex items-end gap-2 text-sm text-foreground">
          <input name="isPostedToJobMarket" type="checkbox" className="mb-3 h-4 w-4" />
          <span className="mb-2">Post to Job Market</span>
        </label>
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-panel px-4 text-sm font-medium text-foreground disabled:opacity-60"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isPending ? "Creating..." : "Create Work Order"}
        </button>
      </div>
    </form>
  );
}
