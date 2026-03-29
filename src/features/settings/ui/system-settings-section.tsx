import { SettingsCard } from "@/features/settings/ui/settings-card";

export function SystemSettingsSection() {
  return (
    <SettingsCard
      id="system"
      label="System"
      title="Advanced local controls"
      description="Operational tools for resetting local client state and development session behavior."
    >
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-panel px-4 text-sm font-medium text-foreground"
          >
            Reset Local Session
          </button>
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-panel px-4 text-sm font-medium text-foreground"
          >
            Clear Cache
          </button>
        </div>
        <p className="text-sm text-muted">Advanced / developer options for this current workspace shell.</p>
      </div>
    </SettingsCard>
  );
}
