import { CheckCircle2, CreditCard, FolderKanban, HardDrive } from "lucide-react";
import { SettingsCard } from "@/features/settings/ui/settings-card";

export function SubscriptionSettingsSection() {
  return (
    <SettingsCard
      id="subscription"
      label="Billing"
      title="Plan and billing controls"
      description="Keep an eye on plan status, renewal timing, and workspace usage from one Registruum billing surface."
      highlighted
    >
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[1.4rem] border border-border bg-panel px-4 py-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Current Plan</p>
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">Free</p>
          </div>
          <div className="rounded-[1.4rem] border border-border bg-panel px-4 py-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-accent" />
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Billing Cycle</p>
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">Monthly</p>
          </div>
          <div className="rounded-[1.4rem] border border-border bg-panel px-4 py-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Renewal Date</p>
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">April 26, 2026</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.6rem] border border-border bg-panel p-5">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-accent" />
              <p className="text-base font-semibold text-foreground">Storage usage</p>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-muted">Used space</span>
              <span className="font-medium text-foreground">1.2 GB / 5 GB</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-border">
              <div className="h-2 w-[24%] rounded-full bg-accent" />
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-border bg-panel p-5">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-accent" />
              <p className="text-base font-semibold text-foreground">Members usage</p>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-muted">Active seats</span>
              <span className="font-medium text-foreground">4 / 10</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-border">
              <div className="h-2 w-[40%] rounded-full bg-accent" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-accent px-5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(31,95,255,0.24)] dark:shadow-none"
          >
            Upgrade Plan
          </button>
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-panel px-5 text-sm font-medium text-foreground transition-colors hover:bg-panel-muted"
          >
            Manage Billing
          </button>
        </div>
      </div>
    </SettingsCard>
  );
}
