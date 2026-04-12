"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { Calendar, MapPin, MoreVertical } from "lucide-react";
import {
  completeMobileWorkOrder,
  setMobileWorkOrderStatus,
} from "@/features/mobile/actions/mobile-work-order.actions";
import { getMobileStatusLabel, getMobileStatusTone } from "@/features/mobile/lib/presentation";
import type { MobileWorkOrderDetailsData } from "@/features/mobile/types/mobile";
import { MobileBottomSheet } from "@/features/mobile/ui/mobile-bottom-sheet";
import { MobileStatusPill } from "@/features/mobile/ui/mobile-primitives";
import { MobileShell } from "@/features/mobile/ui/mobile-shell";
import { MobileWorkOrderChatTab } from "@/features/mobile/work-orders/ui/mobile-work-order-chat-tab";
import { MobileWorkOrderDocumentsTab } from "@/features/mobile/work-orders/ui/mobile-work-order-documents-tab";
import { MobileWorkOrderLogsTab } from "@/features/mobile/work-orders/ui/mobile-work-order-logs-tab";
import { MobileWorkOrderOverviewTab } from "@/features/mobile/work-orders/ui/mobile-work-order-overview-tab";
import {
  initialWorkOrderActionState,
  type WorkOrderActionState,
} from "@/features/work-orders/types/work-order-action-state";
import { formatDateLabel, formatWorkOrderLocation } from "@/lib/utils";

type MobileWorkOrderScreenProps = Readonly<{
  data: MobileWorkOrderDetailsData;
  currentTab: "overview" | "chat" | "documents" | "logs";
  backHref: string;
  buildTabHref: (tab: "overview" | "chat" | "documents" | "logs") => string;
}>;

export function MobileWorkOrderScreen({
  data,
  currentTab,
  backHref,
  buildTabHref,
}: MobileWorkOrderScreenProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [completeState, completeAction, isCompleting] = useActionState<
    WorkOrderActionState,
    FormData
  >(completeMobileWorkOrder, initialWorkOrderActionState);
  const statusAction = setMobileWorkOrderStatus.bind(
    null,
    initialWorkOrderActionState,
  );
  const submitStatusAction = async (formData: FormData) => {
    await statusAction(formData);
  };

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [menuOpen]);

  const locationLabel = formatWorkOrderLocation(
    data.workOrder.locationLabel,
    data.workOrder.unitLabel,
  );
  const shouldShowCompleteAction =
    data.canComplete &&
    !data.archivedMeta &&
    data.workOrder.status !== "completed" &&
    data.workOrder.status !== "archived";
  const currentHref = buildTabHref(currentTab);

  return (
    <MobileShell showNav={false}>
      <div className="space-y-0 pb-24">
        <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur-md">
          <div className="flex items-start gap-4">
            <Link
              href={backHref}
              className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.04)]"
            >
              <span className="sr-only">Back</span>
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <h1 className="truncate text-[2rem] font-semibold tracking-tight text-slate-950">
                  {data.workOrder.title}
                </h1>
                <MobileStatusPill
                  label={getMobileStatusLabel(data.workOrder.status)}
                  tone={getMobileStatusTone(data.workOrder.status)}
                />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-6 text-[1.05rem] text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {locationLabel}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDateLabel(data.workOrder.dueDate ?? data.workOrder.expirationAt)}
                </span>
              </div>
            </div>
            <div className="relative shrink-0" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((current) => !current)}
                className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-[0_8px_20px_rgba(15,23,42,0.04)]"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
              {menuOpen ? (
                <div className="absolute right-0 top-16 z-20 w-56 rounded-[22px] border border-slate-200 bg-white p-3 shadow-[0_20px_40px_rgba(15,23,42,0.12)]">
                  <form action={submitStatusAction} className="space-y-1">
                    <input type="hidden" name="spaceId" value={data.space.id} />
                    <input type="hidden" name="workOrderId" value={data.workOrder.id} />
                    <input type="hidden" name="returnTo" value={currentHref} />
                    <input type="hidden" name="status" value="open" />
                    <button
                      type="submit"
                      className="flex h-12 w-full items-center rounded-2xl px-4 text-left text-[1.05rem] font-medium text-slate-800 hover:bg-slate-50"
                    >
                      Mark Active
                    </button>
                  </form>
                  <form action={submitStatusAction} className="space-y-1">
                    <input type="hidden" name="spaceId" value={data.space.id} />
                    <input type="hidden" name="workOrderId" value={data.workOrder.id} />
                    <input type="hidden" name="returnTo" value={currentHref} />
                    <input type="hidden" name="status" value="in_progress" />
                    <button
                      type="submit"
                      className="flex h-12 w-full items-center rounded-2xl px-4 text-left text-[1.05rem] font-medium text-slate-800 hover:bg-slate-50"
                    >
                      Mark In Progress
                    </button>
                  </form>
                  {shouldShowCompleteAction ? (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setCompleteOpen(true);
                      }}
                      className="flex h-12 w-full items-center rounded-2xl px-4 text-left text-[1.05rem] font-medium text-slate-800 hover:bg-slate-50"
                    >
                      Mark Completed
                    </button>
                  ) : null}
                  {data.workOrder.status === "completed" && !data.archivedMeta ? (
                    <div className="flex h-12 w-full items-center rounded-2xl px-4 text-left text-[1.05rem] font-medium text-slate-400">
                      Archive
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 border-b border-slate-200 bg-white px-6">
          {([
            ["overview", "Overview"],
            ["chat", "Chat"],
            ["documents", "Docs"],
            ["logs", "Logs"],
          ] as const).map(([tab, label]) => (
            <Link
              key={tab}
              href={buildTabHref(tab)}
              className={
                currentTab === tab
                  ? "inline-flex h-14 items-center justify-center border-b-[3px] border-[#3566d6] px-2 text-[1.05rem] font-medium text-[#3566d6]"
                  : "inline-flex h-14 items-center justify-center border-b-[3px] border-transparent px-2 text-[1.05rem] font-medium text-slate-500"
              }
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="bg-[#f3f6fb] px-3 py-4">
          {currentTab === "overview" ? (
            <MobileWorkOrderOverviewTab
              data={data}
              buildTabHref={buildTabHref}
              onComplete={() => setCompleteOpen(true)}
              canShowCompleteAction={shouldShowCompleteAction}
            />
          ) : null}
          {currentTab === "chat" ? <MobileWorkOrderChatTab data={data} /> : null}
          {currentTab === "documents" ? <MobileWorkOrderDocumentsTab data={data} /> : null}
          {currentTab === "logs" ? <MobileWorkOrderLogsTab logs={data.logs} /> : null}
        </div>
      </div>

      <MobileBottomSheet
        open={completeOpen}
        onClose={() => setCompleteOpen(false)}
        title="Complete Work Order"
        description="Once completed, this work order becomes locked and cannot be changed until it is reopened."
      >
        <form action={completeAction} className="space-y-4">
          <input type="hidden" name="spaceId" value={data.space.id} />
          <input type="hidden" name="workOrderId" value={data.workOrder.id} />
          <input type="hidden" name="returnTo" value={buildTabHref("overview")} />
          {completeState.error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {completeState.error}
            </div>
          ) : null}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
            Completing this work order confirms that the record is finished. Users will no longer be able to edit documents, chat, or settings until it is reopened.
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setCompleteOpen(false)}
              className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCompleting}
              className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl bg-[#3566d6] text-sm font-semibold text-white shadow-[0_14px_28px_rgba(53,102,214,0.22)] disabled:opacity-60"
            >
              {isCompleting ? "Completing..." : "Confirm Complete"}
            </button>
          </div>
        </form>
      </MobileBottomSheet>
    </MobileShell>
  );
}
