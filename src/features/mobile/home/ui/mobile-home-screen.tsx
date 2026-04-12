"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarDays, ClipboardList, MapPin, Plus, Search } from "lucide-react";
import { getMobileStatusLabel, getMobileStatusTone } from "@/features/mobile/lib/presentation";
import {
  getMobileCreateWorkOrderHref,
  getMobileWorkOrderHref,
} from "@/features/mobile/lib/routes";
import type { MobileHomeData, MobileWorkOrderCard } from "@/features/mobile/types/mobile";
import { MobileCard, MobileStatusPill } from "@/features/mobile/ui/mobile-primitives";
import { MobileShell } from "@/features/mobile/ui/mobile-shell";

function filterCards(cards: MobileWorkOrderCard[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return cards;
  }

  return cards.filter((card) =>
    [card.title, card.spaceName, card.locationLabel, card.activityHint]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery),
  );
}

export function MobileHomeScreen({ data }: Readonly<{ data: MobileHomeData }>) {
  const [query, setQuery] = useState("");
  const visibleActive = useMemo(
    () => filterCards(data.activeWorkOrders, query),
    [data.activeWorkOrders, query],
  );
  const visibleDueSoon = useMemo(
    () => filterCards(data.dueSoonWorkOrders, query),
    [data.dueSoonWorkOrders, query],
  );

  return (
    <MobileShell>
      <div className="mobile-screen-bg space-y-6 px-5 py-7">
        <section className="space-y-4">
          <div>
            <p className="text-[1.05rem] font-medium text-slate-500">Welcome back,</p>
            <h1 className="mt-2 text-[2.25rem] font-semibold tracking-[-0.05em] text-slate-950">
              {data.profile.fullName} <span aria-hidden="true">👋</span>
            </h1>
          </div>

          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search work orders..."
              className="mobile-input-surface h-14 w-full pl-12 pr-4 text-[1rem] text-slate-950 outline-none"
            />
          </label>

          {data.createSpaceId ? (
            <Link
              href={getMobileCreateWorkOrderHref(data.createSpaceId)}
              className="mobile-primary-button inline-flex h-16 w-full items-center justify-center gap-3 px-5 text-[1.1rem] font-semibold active:scale-[0.98]"
            >
              <Plus className="h-5 w-5" />
              Create Work Order
            </Link>
          ) : null}
        </section>

        <section>
          <div className="mb-4 flex items-center gap-3">
            <ClipboardList className="h-5 w-5 text-slate-500" />
            <h2 className="text-[1.15rem] font-semibold text-slate-950">Active Work Orders</h2>
            <span className="mobile-soft-badge inline-flex h-8 min-w-8 items-center justify-center px-2 text-sm font-medium">
              {visibleActive.length}
            </span>
          </div>
          <div className="space-y-3">
            {visibleActive.length > 0 ? (
              visibleActive.map((card) => (
                <Link
                  key={card.id}
                  href={getMobileWorkOrderHref(card.spaceId, card.id)}
                  className="block active:scale-[0.98]"
                >
                  <MobileCard className="space-y-3 rounded-[24px] border-slate-200 bg-white px-5 py-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[1.18rem] font-semibold tracking-[-0.03em] text-slate-950">{card.title}</p>
                        <p className="mt-1 text-[1rem] text-slate-500">{card.spaceName}</p>
                      </div>
                      <MobileStatusPill
                        label={getMobileStatusLabel(card.status)}
                        tone={getMobileStatusTone(card.status)}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-base text-slate-500">
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {card.locationLabel}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        {card.dueLabel}
                      </span>
                      {card.activityHint ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full bg-blue-100" />
                          {card.activityHint}
                        </span>
                      ) : null}
                    </div>
                  </MobileCard>
                </Link>
              ))
            ) : (
              <MobileCard className="rounded-[24px] bg-white text-base text-slate-500 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                No active work orders match the current search.
              </MobileCard>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-[1.05rem] font-semibold text-slate-950">Due Soon</h2>
          <div className="space-y-3">
            {visibleDueSoon.length > 0 ? (
              visibleDueSoon.slice(0, 3).map((card) => (
                <Link
                  key={card.id}
                  href={getMobileWorkOrderHref(card.spaceId, card.id)}
                  className="block active:scale-[0.98]"
                >
                  <MobileCard className="rounded-[24px] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-slate-950">{card.title}</p>
                        <p className="mt-1 text-sm text-slate-500">{card.spaceName} · {card.dueLabel}</p>
                      </div>
                      <MobileStatusPill
                        label={getMobileStatusLabel(card.status)}
                        tone={getMobileStatusTone(card.status)}
                      />
                    </div>
                  </MobileCard>
                </Link>
              ))
            ) : (
              <MobileCard className="rounded-[24px] bg-white text-base text-slate-500 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                Nothing is due soon right now.
              </MobileCard>
            )}
          </div>
        </section>

        <section className="space-y-3 pb-2">
          <h2 className="text-[1.05rem] font-semibold text-slate-950">Recent Activity</h2>
          <div className="space-y-3">
            {data.recentActivity.slice(0, 5).map((entry) => (
              <MobileCard key={entry.id} className="rounded-[24px] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-950">{entry.actorName}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{entry.details ?? entry.action}</p>
                  </div>
                  <p className="shrink-0 text-sm text-slate-400">{entry.createdAt}</p>
                </div>
              </MobileCard>
            ))}
          </div>
        </section>
      </div>
    </MobileShell>
  );
}
