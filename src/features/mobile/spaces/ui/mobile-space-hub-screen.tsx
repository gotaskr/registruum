"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { canCreateWorkOrder } from "@/features/permissions/lib/work-order-permissions";
import { getMobileStatusLabel, getMobileStatusTone } from "@/features/mobile/lib/presentation";
import {
  getMobileCreateWorkOrderHref,
  getMobileSpacesHref,
  getMobileWorkOrderHref,
} from "@/features/mobile/lib/routes";
import type { MobileSpaceHubData } from "@/features/mobile/types/mobile";
import {
  MobileCard,
  MobileDetailHeader,
  MobileSectionTitle,
  MobileStatusPill,
} from "@/features/mobile/ui/mobile-primitives";
import { MobileShell } from "@/features/mobile/ui/mobile-shell";
import { formatDateLabel, formatWorkOrderLocation } from "@/lib/utils";
import type { WorkOrder } from "@/types/work-order";

type MobileSpaceFilter = "active" | "draft" | "completed";

function matchesFilter(workOrder: WorkOrder, filter: MobileSpaceFilter) {
  if (filter === "active") {
    return workOrder.status === "in_progress" || workOrder.status === "on_hold";
  }

  if (filter === "draft") {
    return workOrder.status === "open";
  }

  return workOrder.status === "completed";
}

export function MobileSpaceHubScreen({
  data,
}: Readonly<{
  data: MobileSpaceHubData;
}>) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MobileSpaceFilter>("active");
  const canShowCreateAction = canCreateWorkOrder(data.space.membershipRole ?? null);

  const visibleWorkOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return data.workOrders
      .filter((workOrder) => matchesFilter(workOrder, filter))
      .filter((workOrder) =>
        normalizedQuery.length > 0
          ? [
              workOrder.title,
              workOrder.description,
              workOrder.locationLabel,
              workOrder.unitLabel,
            ]
              .filter((value): value is string => Boolean(value))
              .join(" ")
              .toLowerCase()
              .includes(normalizedQuery)
          : true,
      );
  }, [data.workOrders, filter, query]);

  return (
    <MobileShell
      header={
        <div>
          <MobileDetailHeader backHref={getMobileSpacesHref()} title={data.space.name} />
          <div className="border-b border-slate-200 bg-white px-4 pb-4">
            {canShowCreateAction ? (
              <Link
                href={getMobileCreateWorkOrderHref(data.space.id)}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#3566d6] px-4 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(53,102,214,0.2)] active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                Create Work Order
              </Link>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Work order creation is limited to space admins.
              </div>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-5 bg-[#f3f6fb] px-4 py-4">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search work orders"
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-950 outline-none shadow-[0_8px_20px_rgba(15,23,42,0.04)]"
          />
        </label>

        <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
          {([
            ["active", "Active"],
            ["draft", "Draft"],
            ["completed", "Completed"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={
                filter === value
                  ? "inline-flex h-10 shrink-0 items-center rounded-full bg-[#3566d6] px-4 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(53,102,214,0.15)]"
                  : "inline-flex h-9 shrink-0 items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-500"
              }
            >
              {label}
            </button>
          ))}
        </div>

        <section>
          <MobileSectionTitle title="Work Orders" />
          <div className="space-y-3">
            {visibleWorkOrders.map((workOrder) => (
              <Link
                key={workOrder.id}
                href={getMobileWorkOrderHref(data.space.id, workOrder.id)}
                className="block active:scale-[0.98]"
              >
                <MobileCard className="bg-white">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-slate-950">
                        {workOrder.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatWorkOrderLocation(
                          workOrder.locationLabel,
                          workOrder.unitLabel,
                        )}
                      </p>
                    </div>
                    <MobileStatusPill
                      label={getMobileStatusLabel(workOrder.status)}
                      tone={getMobileStatusTone(workOrder.status)}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
                    <span>Due {formatDateLabel(workOrder.dueDate ?? workOrder.expirationAt)}</span>
                    <span>Updated {formatDateLabel(workOrder.updatedAt)}</span>
                  </div>
                </MobileCard>
              </Link>
            ))}
            {visibleWorkOrders.length === 0 ? (
              <MobileCard className="bg-white text-sm text-slate-500">
                No work orders match this filter yet.
              </MobileCard>
            ) : null}
          </div>
        </section>

        <section>
          <MobileSectionTitle title="Recent Activity" />
          <div className="space-y-3">
            {data.recentActivity.slice(0, 4).map((entry) => (
              <MobileCard key={entry.id} className="bg-white p-3.5">
                <p className="text-sm font-semibold text-slate-950">{entry.action}</p>
                <p className="mt-1 text-sm text-slate-600">{entry.details ?? entry.actorName}</p>
                <p className="mt-2 text-xs text-slate-400">{entry.createdAt}</p>
              </MobileCard>
            ))}
          </div>
        </section>
      </div>
    </MobileShell>
  );
}
