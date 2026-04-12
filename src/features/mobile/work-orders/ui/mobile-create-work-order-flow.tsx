"use client";

import Link from "next/link";
import { useActionState, useMemo, useRef, useState } from "react";
import { Camera, ChevronLeft } from "lucide-react";
import { createMobileWorkOrder } from "@/features/mobile/actions/mobile-work-order.actions";
import { getMobileSpaceHref } from "@/features/mobile/lib/routes";
import { MobileCard } from "@/features/mobile/ui/mobile-primitives";
import { MobileShell } from "@/features/mobile/ui/mobile-shell";
import {
  initialWorkOrderActionState,
  type WorkOrderActionState,
} from "@/features/work-orders/types/work-order-action-state";

type MobileCreateMember = Readonly<{
  userId: string;
  name: string;
  role: string;
}>;

type MobileCreateWorkOrderFlowProps = Readonly<{
  spaceId: string;
  spaceName: string;
  members: MobileCreateMember[];
}>;

type CreateStep = 1 | 2 | 3;

export function MobileCreateWorkOrderFlow({
  spaceId,
  spaceName,
  members,
}: MobileCreateWorkOrderFlowProps) {
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [step, setStep] = useState<CreateStep>(1);
  const [title, setTitle] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPhotoCount, setSelectedPhotoCount] = useState(0);
  const [state, formAction, isPending] = useActionState<WorkOrderActionState, FormData>(
    createMobileWorkOrder,
    initialWorkOrderActionState,
  );
  const sortedMembers = useMemo(
    () => [...members].sort((left, right) => left.name.localeCompare(right.name)),
    [members],
  );
  const canContinue =
    step === 1 ? title.trim().length > 1 && locationLabel.trim().length > 0 : true;
  const canSubmit = title.trim().length > 1;

  return (
    <MobileShell showNav={false}>
      <form action={formAction} className="flex min-h-full flex-col">
        <input type="hidden" name="spaceId" value={spaceId} />
        <input type="hidden" name="subject" value="" />
        <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur-md">
          <div className="flex items-center gap-4">
            {step === 1 ? (
              <Link
                href={getMobileSpaceHref(spaceId)}
                className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.04)]"
              >
                <ChevronLeft className="h-5 w-5" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setStep((current) => ((current - 1) as CreateStep))}
                className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.04)]"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <div className="flex-1 text-center">
              <p className="text-[2rem] font-semibold tracking-tight text-slate-950">
                New Work Order
              </p>
            </div>
            <div className="h-14 w-14 shrink-0" />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            {[1, 2, 3].map((value) => (
              <div
                key={value}
                className={
                  value <= step
                    ? "h-2.5 rounded-full bg-[#3566d6]"
                    : "h-2.5 rounded-full bg-slate-200"
                }
              />
            ))}
          </div>
        </div>

        <div className="flex-1 space-y-6 bg-[#f3f6fb] px-6 py-6 pb-8">
          {state.error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {state.error}
            </div>
          ) : null}

          <section className={step === 1 ? "block" : "hidden"}>
            <h2 className="text-[1.9rem] font-semibold text-slate-950">Basic Info</h2>
            <div className="mt-6 space-y-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_34px_rgba(15,23,42,0.06)]">
              <label className="block space-y-2">
                <span className="text-[1.05rem] font-medium text-slate-950">Work Order Name</span>
                <input
                  name="title"
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Fix lobby lights"
                  className="h-16 w-full rounded-[22px] border border-slate-200 bg-white px-5 text-[1.05rem] text-slate-950 outline-none"
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="text-[1.05rem] font-medium text-slate-950">Space</span>
                <select
                  value={spaceId}
                  disabled
                  className="h-16 w-full rounded-[22px] border border-slate-200 bg-white px-5 text-[1.05rem] text-slate-500 outline-none"
                >
                  <option value={spaceId}>{spaceName}</option>
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-[1.05rem] font-medium text-slate-950">Type</span>
                <select
                  name="subjectType"
                  defaultValue="maintenance"
                  className="h-16 w-full rounded-[22px] border border-slate-200 bg-white px-5 text-[1.05rem] text-slate-950 outline-none"
                >
                  <option value="issue">issue</option>
                  <option value="maintenance">maintenance</option>
                  <option value="inspection">inspection</option>
                  <option value="project">project</option>
                  <option value="emergency">emergency</option>
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-[1.05rem] font-medium text-slate-950">Location</span>
                <input
                  name="locationLabel"
                  type="text"
                  value={locationLabel}
                  onChange={(event) => setLocationLabel(event.target.value)}
                  placeholder="e.g. Room 205"
                  className="h-16 w-full rounded-[22px] border border-slate-200 bg-white px-5 text-[1.05rem] text-slate-950 outline-none"
                />
              </label>
            </div>
          </section>

          <section className={step === 2 ? "block" : "hidden"}>
            <h2 className="text-[1.9rem] font-semibold text-slate-950">Details</h2>
            <div className="mt-6 space-y-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_34px_rgba(15,23,42,0.06)]">
              <label className="block space-y-2">
                <span className="text-[1.05rem] font-medium text-slate-950">Description</span>
                <textarea
                  name="description"
                  rows={5}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe the work needed..."
                  className="w-full rounded-[22px] border border-slate-200 bg-white px-5 py-4 text-[1.05rem] text-slate-950 outline-none"
                />
              </label>

              <div className="space-y-2">
                <span className="text-[1.05rem] font-medium text-slate-950">Photos</span>
                <input
                  ref={photoInputRef}
                  type="file"
                  name="photos"
                  multiple
                  accept=".jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={(event) => setSelectedPhotoCount(event.currentTarget.files?.length ?? 0)}
                />
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="flex h-28 w-28 flex-col items-center justify-center gap-2 rounded-[22px] border border-dashed border-slate-300 bg-white text-slate-500"
                >
                  <Camera className="h-7 w-7" />
                  <span className="text-base font-medium">
                    {selectedPhotoCount > 0 ? `${selectedPhotoCount} added` : "Add"}
                  </span>
                </button>
              </div>

              <label className="block space-y-2">
                <span className="text-[1.05rem] font-medium text-slate-950">Due Date</span>
                <input
                  name="expirationAt"
                  type="date"
                  className="h-16 w-full rounded-[22px] border border-slate-200 bg-white px-5 text-[1.05rem] text-slate-950 outline-none"
                />
              </label>
            </div>
          </section>

          <section className={step === 3 ? "block" : "hidden"}>
            <h2 className="text-[1.9rem] font-semibold text-slate-950">Assign & Submit</h2>
            <div className="mt-6 space-y-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_34px_rgba(15,23,42,0.06)]">
              <div className="space-y-3">
                <span className="text-[1.05rem] font-medium text-slate-950">Assign Members</span>
                {sortedMembers.length > 0 ? (
                  sortedMembers.map((member) => (
                    <label
                      key={member.userId}
                      className="flex items-center justify-between gap-3 rounded-[22px] border border-slate-200 bg-white px-5 py-4"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                          {member.name
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((part) => part[0] ?? "")
                            .join("")
                            .toUpperCase()}
                        </div>
                        <p className="truncate text-[1.05rem] font-medium text-slate-950">
                          {member.name}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        name="assignedMemberIds"
                        value={member.userId}
                        className="h-5 w-5 rounded border-slate-300 text-[#3566d6]"
                      />
                    </label>
                  ))
                ) : (
                  <MobileCard className="text-base text-slate-500">
                    No members available yet.
                  </MobileCard>
                )}
              </div>

              <label className="flex items-center justify-between gap-4 rounded-[22px] border border-slate-200 bg-white px-5 py-4">
                <div>
                  <p className="text-[1.05rem] font-medium text-slate-950">Post to Job Market</p>
                  <p className="mt-1 text-base text-slate-500">Make visible to contractors</p>
                </div>
                <input
                  type="checkbox"
                  name="isPostedToJobMarket"
                  className="h-6 w-6 rounded border-slate-300 text-[#3566d6]"
                />
              </label>
            </div>
          </section>
        </div>

        <div className="mt-auto border-t border-slate-200 bg-white px-6 py-5">
          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((current) => (current < 3 ? ((current + 1) as CreateStep) : current))}
              disabled={!canContinue}
              className="inline-flex h-16 w-full items-center justify-center rounded-[22px] bg-[#3566d6] text-[1.15rem] font-semibold text-white shadow-[0_14px_28px_rgba(53,102,214,0.22)] disabled:bg-[#9bb3e9]"
            >
              Continue
            </button>
          ) : (
            <button
              type="submit"
              disabled={isPending || !canSubmit}
              className="inline-flex h-16 w-full items-center justify-center rounded-[22px] bg-[#3566d6] text-[1.15rem] font-semibold text-white shadow-[0_14px_28px_rgba(53,102,214,0.22)] disabled:bg-[#9bb3e9]"
            >
              {isPending ? "Creating..." : "Create Work Order"}
            </button>
          )}
        </div>
      </form>
    </MobileShell>
  );
}
