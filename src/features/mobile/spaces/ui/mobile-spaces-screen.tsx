"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ChevronRight, Layers3, Plus } from "lucide-react";
import { createMobileSpace } from "@/features/mobile/actions/mobile-space.actions";
import { getMobileSpaceHref } from "@/features/mobile/lib/routes";
import type { MobileSpaceListData } from "@/features/mobile/types/mobile";
import { MobileBottomSheet } from "@/features/mobile/ui/mobile-bottom-sheet";
import { MobileCard } from "@/features/mobile/ui/mobile-primitives";
import { MobileShell } from "@/features/mobile/ui/mobile-shell";
import { initialSpaceActionState } from "@/features/spaces/types/space-action-state";

export function MobileSpacesScreen({
  data,
}: Readonly<{
  data: MobileSpaceListData;
}>) {
  const [createOpen, setCreateOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    createMobileSpace,
    initialSpaceActionState,
  );

  return (
    <MobileShell>
      <div className="mobile-screen-bg space-y-5 px-5 py-6">
        <div className="mobile-hero-surface px-5 py-5">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-[2rem] font-semibold tracking-[-0.05em] text-slate-950">Spaces</h1>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="mobile-primary-button inline-flex h-14 items-center justify-center gap-2 px-5 text-[1.05rem] font-semibold active:scale-[0.98]"
            >
              <Plus className="h-5 w-5" />
              New
            </button>
          </div>
          <p className="mt-3 text-[0.98rem] leading-7 text-slate-500">
            Open a space to jump straight into the work orders that need attention.
          </p>
        </div>

        <div className="space-y-4">
          {data.items.map((item, index) => {
            const accentClassName =
              index % 3 === 0
                ? "bg-blue-50 text-[#3566d6]"
                : index % 3 === 1
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-violet-50 text-violet-600";

            return (
              <Link
                key={item.id}
                href={getMobileSpaceHref(item.id)}
                className="block active:scale-[0.98]"
              >
                <MobileCard className="flex items-center gap-4 bg-[linear-gradient(180deg,#ffffff_0%,#fbfcff_100%)]">
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] ${accentClassName}`}
                  >
                    <Layers3 className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[1.15rem] font-semibold text-slate-950">
                      {item.name}
                    </p>
                    <p className="mt-1 text-base text-slate-500">
                      {item.workOrderCount} work orders
                    </p>
                    <p className="mt-1 text-sm text-slate-400">{item.latestActivityLabel}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
                </MobileCard>
              </Link>
            );
          })}
        </div>
      </div>

      <MobileBottomSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Space"
        description="Add a new property space and continue working from mobile."
      >
        <form action={formAction} className="space-y-4">
          {state.error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {state.error}
            </div>
          ) : null}
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Space name</span>
            <input
              name="name"
              type="text"
              placeholder="Savanna"
              className="mobile-input-surface h-12 w-full px-4 text-sm text-slate-950 outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={isPending}
            className="mobile-primary-button inline-flex h-12 w-full items-center justify-center text-sm font-semibold disabled:opacity-60"
          >
            {isPending ? "Creating..." : "Create Space"}
          </button>
        </form>
      </MobileBottomSheet>
    </MobileShell>
  );
}
