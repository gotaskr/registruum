"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FormMessage } from "@/features/auth/ui/form-message";
import { updateProfileDisplayIdentity } from "@/features/settings/actions/profile.actions";
import { SettingsCard } from "@/features/settings/ui/settings-card";
import {
  initialProfileActionState,
} from "@/features/settings/types/profile-action-state";
import type { Profile } from "@/types/profile";

type ProfileDisplayIdentityCardProps = Readonly<{
  profile: Profile;
}>;

export function ProfileDisplayIdentityCard({
  profile,
}: ProfileDisplayIdentityCardProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    updateProfileDisplayIdentity,
    initialProfileActionState,
  );
  const [displayName, setDisplayName] = useState(profile.displayName ?? profile.fullName);

  useEffect(() => {
    if (!state.success) {
      return;
    }

    router.refresh();
  }, [router, state.success]);

  return (
    <SettingsCard
      label="Display"
      title="Signature and display identity"
      description="Control the name shown across system-facing collaboration surfaces."
    >
      <form action={formAction} className="space-y-4">
        <label className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
            Display Name
          </span>
          <input
            name="displayName"
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="h-12 w-full rounded-2xl border border-border bg-panel-muted px-4 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent focus:bg-panel"
          />
          <p className="text-sm text-muted">
            Used in chat, logs, and work orders.
          </p>
          <div className="rounded-[1.35rem] border border-border bg-panel-muted px-4 py-3 text-sm text-foreground">
            <span className="text-muted">Preview:</span> {displayName || profile.fullName}
          </div>
        </label>

        <FormMessage
          message={state.error ?? state.success}
          tone={state.error ? "error" : "info"}
        />

        <div className="flex justify-end border-t border-border pt-4">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-accent px-5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(31,95,255,0.24)] disabled:opacity-60 dark:shadow-none"
          >
            {isPending ? "Saving..." : "Save Display Name"}
          </button>
        </div>
      </form>
    </SettingsCard>
  );
}
