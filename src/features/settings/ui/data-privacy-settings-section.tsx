import { SettingsCard } from "@/features/settings/ui/settings-card";

export function DataPrivacySettingsSection() {
  return (
    <SettingsCard
      id="data-privacy"
      label="Data & Privacy"
      title="Exports and account removal"
      description="Control the lifecycle of your personal account data."
    >
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled
          className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-panel-muted px-4 text-sm font-medium text-muted disabled:opacity-100"
        >
          Export Data
        </button>
        <button
          type="button"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-700"
        >
          Delete Account
        </button>
      </div>
    </SettingsCard>
  );
}
