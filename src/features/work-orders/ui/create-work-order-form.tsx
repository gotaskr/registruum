"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
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
import { cn } from "@/lib/utils";
import type { WorkOrderSubjectType } from "@/types/work-order";

const inputSurfaceClass =
  "h-12 w-full rounded-2xl border border-[#dbe4f0] bg-[#f9fbff] text-sm text-foreground outline-none transition focus:border-[#97b5ff] focus:bg-white dark:border-border dark:bg-panel-muted dark:focus:border-accent";

type CreateWorkOrderFormProps = Readonly<{
  spaceId: string;
  onCancel?: () => void;
  /** Used by the mobile sheet to block drag-to-dismiss while submitting. */
  onBusyChange?: (busy: boolean) => void;
}>;

export function CreateWorkOrderForm({
  spaceId,
  onCancel,
  onBusyChange,
}: CreateWorkOrderFormProps) {
  const [subjectType, setSubjectType] = useState<WorkOrderSubjectType>("issue");
  const [title, setTitle] = useState("");
  const [expirationAt, setExpirationAt] = useState("");
  const [state, formAction, isPending] = useActionState(
    createWorkOrder,
    initialWorkOrderActionState,
  );
  const today = new Date().toISOString().slice(0, 10);

  const canSubmit = useMemo(() => {
    if (title.trim().length < 2) {
      return false;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expirationAt)) {
      return false;
    }
    return expirationAt >= today;
  }, [title, expirationAt, today]);

  useEffect(() => {
    onBusyChange?.(isPending);
  }, [isPending, onBusyChange]);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!canSubmit) {
          event.preventDefault();
        }
      }}
      className="space-y-5 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:space-y-6 sm:px-5 sm:pb-5 sm:pt-5"
    >
      <input type="hidden" name="spaceId" value={spaceId} />
      <FormMessage message={state.error} />
      <section className="rounded-[1.5rem] border border-[#dbe4f0] bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.05)] dark:border-border dark:bg-panel sm:rounded-[1.75rem] sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.25rem] bg-[#edf3ff] text-[#2f5fd4] dark:bg-accent-soft dark:text-accent">
            <BriefcaseBusiness className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8093af] dark:text-muted">
              Work Order Setup
            </p>
            <h3 className="mt-2 text-lg font-semibold text-foreground sm:text-xl">
              Launch a new project inside this space
            </h3>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:mt-6 lg:grid-cols-2">
          <label className="block space-y-2 lg:col-span-2">
            <span className="text-sm font-medium text-foreground">
              Name of Work Order{" "}
              <span className="font-normal text-muted">(required)</span>
            </span>
            <div className="relative">
              <input
                name="title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Boiler room electrical assessment"
                autoComplete="off"
                className={`${inputSurfaceClass} px-4 pl-11`}
              />
              <ClipboardPenLine className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7f8ca3] dark:text-muted" />
            </div>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">Type</span>
            <div className="relative">
              <select
                name="subjectType"
                value={subjectType}
                onChange={(event) => setSubjectType(event.target.value as WorkOrderSubjectType)}
                className={`${inputSurfaceClass} appearance-none px-4 pl-11 pr-10`}
              >
                {workOrderSubjectTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Tags className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7f8ca3] dark:text-muted" />
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
              className={`${inputSurfaceClass} px-4`}
            />
          </label>

          <label className="block space-y-2 lg:col-span-2">
            <span className="text-sm font-medium text-foreground">Location</span>
            <div className="relative">
              <input
                name="locationLabel"
                type="text"
                placeholder="Facility or unit"
                className={`${inputSurfaceClass} px-4 pl-11`}
              />
              <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7f8ca3] dark:text-muted" />
            </div>
          </label>
          <input type="hidden" name="unitLabel" value="" />

          <label className="block space-y-2 lg:col-span-2">
            <span className="text-sm font-medium text-foreground">Description</span>
            <textarea
              name="description"
              rows={5}
              placeholder="Add the work scope, access notes, or anything your team should know before starting."
              className="w-full rounded-[1.25rem] border border-[#dbe4f0] bg-[#f9fbff] px-4 py-3.5 text-sm text-foreground outline-none transition focus:border-[#97b5ff] focus:bg-white dark:border-border dark:bg-panel-muted dark:focus:border-accent sm:rounded-[1.5rem]"
            />
          </label>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-[#dbe4f0] bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.05)] dark:border-border dark:bg-panel sm:rounded-[1.75rem] sm:p-5">
        <div className="space-y-5">
          <div className="rounded-[1.25rem] border border-[#dbe4f0] bg-[#f9fbff] p-4 dark:border-border dark:bg-panel-muted sm:rounded-[1.5rem]">
            <div className="flex items-center gap-2">
              <FileImage className="h-4 w-4 text-[#2f5fd4] dark:text-accent" />
              <span className="text-sm font-medium text-foreground">Upload Photos</span>
            </div>

            <div className="mt-4">
              <FileUploadField
                name="photos"
                buttonLabel="Upload Photos"
                accept=".jpg,.jpeg,.png,.webp,.gif,.heic,.heif"
                helperText="Multiple photos are supported and will appear in the work order overview and documents."
                className="space-y-3"
                buttonClassName="h-11 w-full rounded-2xl border-[#dbe4f0] bg-white px-4 text-sm font-semibold shadow-[0_10px_24px_rgba(15,23,42,0.04)] dark:border-border dark:bg-panel sm:w-auto"
                helperTextClassName="text-sm leading-6 text-[#5f718b] dark:text-muted"
                fileListClassName="gap-3"
                fileChipClassName="rounded-2xl border-[#dbe4f0] bg-white px-3.5 py-2.5 text-sm dark:border-border dark:bg-panel"
              />
            </div>
          </div>

          <div className="space-y-4 rounded-[1.25rem] border border-[#dbe4f0] bg-[#f9fbff] p-4 dark:border-border dark:bg-panel-muted sm:rounded-[1.5rem]">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#2f5fd4] dark:text-accent" />
              <span className="text-sm font-medium text-foreground">Expiration</span>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">
                Expiration date{" "}
                <span className="font-normal text-muted">(required)</span>
              </span>
              <input
                name="expirationAt"
                type="date"
                required
                min={today}
                value={expirationAt}
                onChange={(event) => setExpirationAt(event.target.value)}
                className={`${inputSurfaceClass} bg-white px-4 dark:bg-panel`}
              />
            </label>
          </div>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-2 border-t border-[#dbe4f0] pt-4 dark:border-border sm:flex-row sm:justify-end sm:gap-3 sm:pt-1">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-[#dbe4f0] bg-white px-5 text-sm font-medium text-foreground shadow-[0_10px_24px_rgba(15,23,42,0.04)] disabled:opacity-60 dark:border-border dark:bg-panel sm:h-11 sm:w-auto"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          disabled={isPending || !canSubmit}
          className={cn(
            "inline-flex h-12 w-full items-center justify-center rounded-2xl px-5 text-sm font-semibold transition-colors sm:h-11 sm:w-auto",
            isPending &&
              "cursor-wait bg-[#1f5fff] text-white opacity-90 shadow-[0_16px_30px_rgba(31,95,255,0.24)] dark:shadow-none",
            !isPending &&
              canSubmit &&
              "bg-[#1f5fff] text-white shadow-[0_16px_30px_rgba(31,95,255,0.24)] dark:shadow-none",
            !isPending &&
              !canSubmit &&
              "cursor-not-allowed bg-slate-200 text-slate-500 shadow-none dark:bg-slate-800 dark:text-slate-400",
          )}
        >
          {isPending ? "Creating..." : "Create Work Order"}
        </button>
      </div>
    </form>
  );
}
