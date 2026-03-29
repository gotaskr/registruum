"use client";

type SpaceEmptyHeroProps = Readonly<{
  onCreateWorkOrder: () => void;
}>;

export function SpaceEmptyHero({
  onCreateWorkOrder,
}: SpaceEmptyHeroProps) {
  return (
    <section className="rounded-2xl bg-panel px-8 py-12 shadow-[0_12px_40px_rgba(15,23,42,0.06)] ring-1 ring-border">
      <div className="max-w-2xl space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
          Getting Started
        </p>
        <div className="space-y-3">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">
            No Work Orders Yet
          </h2>
          <p className="text-base text-muted">
            Start tracking work by creating your first work order.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreateWorkOrder}
          className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-950 px-6 text-sm font-semibold text-white shadow-sm"
        >
          Create Work Order
        </button>
      </div>
    </section>
  );
}
