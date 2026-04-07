"use client";

import { useActionState, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  ClipboardPenLine,
  FileImage,
  MapPin,
  Tags,
} from "lucide-react";
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
    <form action={formAction} className="space-y-6 px-5 py-5">
      <input type="hidden" name="spaceId" value={spaceId} />
      <FormMessage message={state.error} />
      <section className="rounded-[1.75rem] border border-[#dbe4f0] bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.25rem] bg-[#edf3ff] text-[#2f5fd4]">
            <BriefcaseBusiness className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8093af]">
              Work Order Setup
            </p>
            <h3 className="mt-2 text-xl font-semibold text-foreground">
              Launch a new project inside this space
            </h3>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-foreground">Name of Work Order</span>
            <div className="relative">
              <input
                name="title"
                type="text"
                placeholder="Boiler room electrical assessment"
                className="h-12 w-full rounded-2xl border border-[#dbe4f0] bg-[#f9fbff] px-4 pl-11 text-sm text-foreground outline-none transition focus:border-[#97b5ff] focus:bg-white"
              />
              <ClipboardPenLine className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7f8ca3]" />
            </div>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">Type</span>
            <div className="relative">
              <select
                name="subjectType"
                value={subjectType}
                onChange={(event) => setSubjectType(event.target.value as WorkOrderSubjectType)}
                className="h-12 w-full appearance-none rounded-2xl border border-[#dbe4f0] bg-[#f9fbff] px-4 pl-11 pr-10 text-sm text-foreground outline-none transition focus:border-[#97b5ff] focus:bg-white"
              >
                {workOrderSubjectTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Tags className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7f8ca3]" />
            </div>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">
              {getWorkOrderSubjectTypeLabel(subjectType)}
            </span>
            <input
              name="subject"
              type="text"
              placeholder={getWorkOrderSubjectTypePlaceholder(subjectType)}
              className="h-12 w-full rounded-2xl border border-[#dbe4f0] bg-[#f9fbff] px-4 text-sm text-foreground outline-none transition focus:border-[#97b5ff] focus:bg-white"
            />
          </label>

          <label className="block space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-foreground">Location</span>
            <div className="relative">
              <input
                name="locationLabel"
                type="text"
                placeholder="Facility or unit"
                className="h-12 w-full rounded-2xl border border-[#dbe4f0] bg-[#f9fbff] px-4 pl-11 text-sm text-foreground outline-none transition focus:border-[#97b5ff] focus:bg-white"
              />
              <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7f8ca3]" />
            </div>
          </label>
          <input type="hidden" name="unitLabel" value="" />

          <label className="block space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-foreground">Description</span>
            <textarea
              name="description"
              rows={5}
              placeholder="Add the work scope, access notes, or anything your team should know before starting."
              className="w-full rounded-[1.5rem] border border-[#dbe4f0] bg-[#f9fbff] px-4 py-3.5 text-sm text-foreground outline-none transition focus:border-[#97b5ff] focus:bg-white"
            />
          </label>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-[#dbe4f0] bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
        <div className="space-y-5">
          <div className="rounded-[1.5rem] border border-[#dbe4f0] bg-[#f9fbff] p-4">
            <div className="flex items-center gap-2">
              <FileImage className="h-4 w-4 text-[#2f5fd4]" />
              <span className="text-sm font-medium text-foreground">Upload Photos</span>
            </div>

            <div className="mt-4">
              <FileUploadField
                name="photos"
                buttonLabel="Upload Photos"
                accept=".jpg,.jpeg,.png,.webp,.gif,.heic,.heif"
                helperText="Multiple photos are supported and will appear in the work order overview and documents."
                className="space-y-3"
                buttonClassName="h-11 rounded-2xl border-[#dbe4f0] bg-white px-4 text-sm font-semibold shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
                helperTextClassName="text-sm leading-6 text-[#5f718b]"
                fileListClassName="gap-3"
                fileChipClassName="rounded-2xl border-[#dbe4f0] bg-white px-3.5 py-2.5 text-sm"
              />
            </div>
          </div>

          <div className="space-y-4 rounded-[1.5rem] border border-[#dbe4f0] bg-[#f9fbff] p-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#2f5fd4]" />
              <span className="text-sm font-medium text-foreground">Launch Options</span>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">Expiration Date</span>
              <input
                name="expirationAt"
                type="date"
                min={today}
                className="h-12 w-full rounded-2xl border border-[#dbe4f0] bg-white px-4 text-sm text-foreground outline-none transition focus:border-[#97b5ff]"
              />
            </label>

            <label className="flex items-start gap-3 rounded-[1.25rem] border border-[#dbe4f0] bg-white px-4 py-3">
              <input
                name="isPostedToJobMarket"
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-[#c8d7ee]"
              />
              <span>
                <span className="block text-sm font-medium text-foreground">Post to Job Market</span>
                <span className="mt-1 block text-sm text-[#5f718b]">
                  Publish this work order for external hiring once it is created.
                </span>
              </span>
            </label>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-end gap-3 border-t border-[#dbe4f0] pt-1">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#dbe4f0] bg-white px-5 text-sm font-medium text-foreground shadow-[0_10px_24px_rgba(15,23,42,0.04)] disabled:opacity-60"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#1f5fff] px-5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(31,95,255,0.24)] disabled:opacity-60"
        >
          {isPending ? "Creating..." : "Create Work Order"}
        </button>
      </div>
    </form>
  );
}
