import { SettingsCard } from "@/features/settings/ui/settings-card";

export function SubscriptionSettingsSection() {
  return (
    <SettingsCard
      id="subscription"
      label="Subscription"
      title="Plan and billing controls"
      description="A calm billing panel for plan status, renewal timing, and usage visibility."
      highlighted
    >
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Current Plan</p>
            <p className="mt-2 text-sm font-semibold text-foreground">Free</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Billing Cycle</p>
            <p className="mt-2 text-sm font-semibold text-foreground">Monthly</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Renewal Date</p>
            <p className="mt-2 text-sm font-semibold text-foreground">April 26, 2026</p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground">Storage usage</span>
              <span className="text-muted">1.2 GB / 5 GB</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-200">
              <div className="h-2 w-[24%] rounded-full bg-slate-700" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground">Members usage</span>
              <span className="text-muted">4 / 10</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-200">
              <div className="h-2 w-[40%] rounded-full bg-slate-700" />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white"
          >
            Upgrade Plan
          </button>
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-white px-4 text-sm font-medium text-foreground"
          >
            Manage Billing
          </button>
        </div>
      </div>
    </SettingsCard>
  );
}
