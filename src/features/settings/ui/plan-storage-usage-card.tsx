"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { ChevronRight, HardDrive, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { loadPlanStorageBreakdown } from "@/features/settings/actions/billing-storage.actions";
import type { PlanStorageBreakdownItem } from "@/features/settings/types/plan-storage-breakdown";
import { cn } from "@/lib/utils";

type PlanStorageUsageCardProps = Readonly<{
  usedStorageLabel: string;
  storagePercent: number;
}>;

function kindLabel(kind: PlanStorageBreakdownItem["kind"]) {
  return kind === "unassigned" ? "Other" : "Work order";
}

export function PlanStorageUsageCard({ usedStorageLabel, storagePercent }: PlanStorageUsageCardProps) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<PlanStorageBreakdownItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = useCallback(() => {
    setOpen(true);
    if (rows !== null || loading) {
      return;
    }

    setLoading(true);
    setError(null);
    void loadPlanStorageBreakdown()
      .then((data) => {
        setRows(data);
      })
      .catch(() => {
        setError("Could not load storage breakdown.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [rows, loading]);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={cn(
          "w-full rounded-[1.6rem] border border-border bg-panel p-5 text-left transition-colors",
          "hover:border-accent/35 hover:bg-panel-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-accent" aria-hidden />
            <p className="text-base font-semibold text-foreground">Storage usage</p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted" aria-hidden />
        </div>
        <p className="mt-1 text-xs text-muted">View spaces and work orders using your plan storage</p>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-muted">Used space</span>
          <span className="font-medium text-foreground">{usedStorageLabel}</span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-border">
          <div
            className="h-2 rounded-full bg-accent"
            style={{ width: `${storagePercent}%` }}
          />
        </div>
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Storage breakdown"
        description="Work orders and other files that count toward your plan, highest usage first."
        panelClassName="max-w-lg w-full"
        bottomSheetOnNarrow
        contentClassName="px-4 py-4 sm:px-5 sm:py-5"
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted">
            <Loader2 className="h-5 w-5 animate-spin text-accent" aria-hidden />
            Loading…
          </div>
        ) : error ? (
          <p className="py-6 text-center text-sm text-destructive">{error}</p>
        ) : rows && rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            No document storage yet. Files in spaces you create (including collaborators' uploads there) will appear here.
          </p>
        ) : rows ? (
          <ul className="flex max-h-[min(60dvh,28rem)] flex-col gap-1 overflow-y-auto pr-0.5">
            {rows.map((row) => (
              <li key={row.id}>
                <Link
                  href={row.href}
                  className="flex items-start justify-between gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-colors hover:border-border hover:bg-panel-muted"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-panel-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                        {kindLabel(row.kind)}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm font-medium text-foreground">{row.primaryLabel}</p>
                    <p className="mt-0.5 truncate text-xs text-muted">{row.secondaryLabel}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">{row.usedLabel}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </Modal>
    </>
  );
}
