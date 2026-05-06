"use client";

import { useActionState, useState } from "react";
import { FileUploadField } from "@/components/ui/file-upload-field";
import { FormMessage } from "@/features/auth/ui/form-message";
import { splitWorkOrderDescription } from "@/features/work-orders/lib/work-order-description";
import {
  getWorkOrderSubjectTypeLabel,
  getWorkOrderSubjectTypePlaceholder,
  type WorkOrderSubjectTypeOptionValue,
  workOrderSubjectTypeOptions,
} from "@/features/work-orders/lib/work-order-subject-types";
import { updateWorkOrder } from "@/features/work-orders/actions/work-order.actions";
import { initialWorkOrderActionState } from "@/features/work-orders/types/work-order-action-state";
import { formatRoleLabel } from "@/lib/utils";
import type { SpaceMembershipRole } from "@/types/database";
import type { WorkOrder } from "@/types/work-order";

type UpdateWorkOrderFormProps = Readonly<{
  workOrder: WorkOrder;
  canEdit: boolean;
  lockedMessage?: string;
  actorRole: SpaceMembershipRole;
  returnTo?: string;
  onCancel?: () => void;
  submitLabel?: string;
}>;

export function UpdateWorkOrderForm({
  workOrder,
  canEdit,
  lockedMessage,
  actorRole,
  returnTo,
  onCancel,
  submitLabel,
}: UpdateWorkOrderFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateWorkOrder,
    initialWorkOrderActionState,
  );
  const details = splitWorkOrderDescription(workOrder.description);
  const [subjectType, setSubjectType] = useState<WorkOrderSubjectTypeOptionValue>(
    workOrder.subjectType ?? details.subjectType,
  );
  const [subject, setSubject] = useState(workOrder.subject ?? details.subject);
  const subjectTypeValue: WorkOrderSubjectTypeOptionValue = subjectType;
  const statusOptions =
    actorRole === "admin"
      ? [
          { value: "open", label: "Draft" },
          { value: "in_progress", label: "In Progress" },
          { value: "on_hold", label: "On Hold" },
          { value: "completed", label: "Completed" },
        ]
      : [
          { value: "open", label: "Draft" },
          { value: "in_progress", label: "In Progress" },
          { value: "on_hold", label: "On Hold" },
        ];

  return (
    <form action={formAction} className="mx-auto max-w-5xl space-y-4 px-6 py-6">
      <input type="hidden" name="workOrderId" value={workOrder.id} />
      <input type="hidden" name="spaceId" value={workOrder.spaceId} />
      <input
        type="hidden"
        name="subjectType"
        value={subjectTypeValue === "other" ? "issue" : subjectTypeValue}
      />
      <input type="hidden" name="returnTo" value={returnTo ?? ""} />
      <input type="hidden" name="ownerUserId" value={workOrder.ownerUserId} />
      <input type="hidden" name="priority" value={workOrder.priority} />
      <input type="hidden" name="startDate" value={workOrder.startDate ?? ""} />
      <input type="hidden" name="vendorName" value={workOrder.vendorName ?? ""} />
      <input
        type="hidden"
        name="autoSaveChatAttachments"
        value={workOrder.autoSaveChatAttachments ? "true" : "false"}
      />
      <input
        type="hidden"
        name="allowDocumentDeletionInProgress"
        value={workOrder.allowDocumentDeletionInProgress ? "true" : "false"}
      />
      <input
        type="hidden"
        name="lockDocumentsOnCompleted"
        value={workOrder.lockDocumentsOnCompleted ? "true" : "false"}
      />
      <input type="hidden" name="editReason" value="" />
      <input
        type="hidden"
        name="isPostedToJobMarket"
        value={workOrder.isPostedToJobMarket ? "true" : "false"}
      />
      <FormMessage
        message={state.error ?? (!canEdit ? lockedMessage : undefined)}
        tone={state.error ? "error" : "info"}
      />
      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">Title</span>
        <input
          name="title"
          type="text"
          defaultValue={workOrder.title}
          disabled={!canEdit}
          className="h-11 w-full rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none disabled:bg-panel-muted"
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">Type</span>
        <select
          value={subjectTypeValue}
          onChange={(event) =>
            setSubjectType(event.target.value as WorkOrderSubjectTypeOptionValue)
          }
          disabled={!canEdit}
          className="h-11 w-full rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none disabled:bg-panel-muted"
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
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          disabled={!canEdit}
          placeholder={getWorkOrderSubjectTypePlaceholder(subjectTypeValue)}
          className="h-11 w-full rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none disabled:bg-panel-muted"
        />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">Location Label</span>
          <input
            name="locationLabel"
            type="text"
            defaultValue={workOrder.locationLabel ?? ""}
            disabled={!canEdit}
            className="h-11 w-full rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none disabled:bg-panel-muted"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">Unit Label</span>
          <input
            name="unitLabel"
            type="text"
            defaultValue={workOrder.unitLabel ?? ""}
            disabled={!canEdit}
            className="h-11 w-full rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none disabled:bg-panel-muted"
          />
        </label>
      </div>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">Description</span>
        <textarea
          name="description"
          rows={5}
          defaultValue={details.description}
          disabled={!canEdit}
          className="w-full rounded-lg border border-border bg-panel px-3 py-3 text-sm text-foreground outline-none disabled:bg-panel-muted"
        />
      </label>
      <div className="space-y-2">
        <span className="text-sm font-medium text-foreground">Add Photos</span>
        <FileUploadField
          name="photos"
          buttonLabel="Upload Photos"
          accept=".jpg,.jpeg,.png,.webp,.gif,.heic,.heif"
          helperText="You can add multiple photos. They will appear in the work order overview and documents."
          disabled={!canEdit}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">Due Date</span>
          <input
            name="dueDate"
            type="date"
            defaultValue={workOrder.dueDate ?? workOrder.expirationAt?.slice(0, 10) ?? ""}
            disabled={!canEdit}
            className="h-11 w-full rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none disabled:bg-panel-muted"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">Status</span>
          <select
            name="status"
            defaultValue={workOrder.status}
            disabled={!canEdit}
            className="h-11 w-full rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none disabled:bg-panel-muted"
          >
            {statusOptions.map((statusOption) => (
              <option key={statusOption.value} value={statusOption.value}>
                {statusOption.label}
              </option>
            ))}
            {!canEdit &&
            !statusOptions.some((statusOption) => statusOption.value === workOrder.status) ? (
              <option value={workOrder.status}>{formatRoleLabel(workOrder.status)}</option>
            ) : null}
          </select>
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={workOrder.isPostedToJobMarket}
          disabled
          readOnly
          className="h-4 w-4"
        />
        <span>Post to Job Market</span>
      </label>
      <div className="flex items-center justify-end gap-3">
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
          disabled={!canEdit || isPending}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isPending ? "Saving..." : submitLabel ?? "Save Work Order"}
        </button>
      </div>
    </form>
  );
}
