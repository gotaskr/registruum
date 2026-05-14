import { Database, HardDrive, Layers3 } from "lucide-react";
import type { StorageSnapshot } from "@/features/settings/api/storage";
import { SettingsCard } from "@/features/settings/ui/settings-card";

type StorageSettingsSectionProps = Readonly<{
  storage: StorageSnapshot;
}>;

export function StorageSettingsSection({
  storage,
}: StorageSettingsSectionProps) {
  return (
    <SettingsCard
      id="storage"
      label="Storage"
      title="Storage activity"
      description="See total storage used across spaces you create (not other people's spaces you join)."
    >
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[1.4rem] border border-border bg-panel px-4 py-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-accent" />
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Total Used</p>
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">{storage.totalUsedLabel}</p>
          </div>
          <div className="rounded-[1.4rem] border border-border bg-panel px-4 py-4">
            <div className="flex items-center gap-2">
              <Layers3 className="h-4 w-4 text-accent" />
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Spaces</p>
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">{storage.spaceCount}</p>
          </div>
          <div className="rounded-[1.4rem] border border-border bg-panel px-4 py-4">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-accent" />
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Scope</p>
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">Account-level total</p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">By space</p>
          {storage.spaces.length === 0 ? (
            <div className="rounded-[1.4rem] border border-dashed border-border bg-panel px-4 py-5 text-sm text-muted">
              No spaces found yet.
            </div>
          ) : (
            <ul className="space-y-2">
              {storage.spaces.map((space) => (
                <li
                  key={space.spaceId}
                  className="rounded-[1.3rem] border border-border bg-panel px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <p className="font-medium text-foreground">{space.spaceName}</p>
                    <p className="text-muted">{space.usedLabel}</p>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-border">
                    <div
                      className="h-2 rounded-full bg-accent"
                      style={{ width: `${Math.max(0, Math.min(100, space.percentOfTotal))}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </SettingsCard>
  );
}
