"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FormMessage } from "@/features/auth/ui/form-message";
import { updateProfileNotifications } from "@/features/settings/actions/notifications.actions";
import { SettingsCard } from "@/features/settings/ui/settings-card";
import { SettingsToggle } from "@/features/settings/ui/settings-toggle";
import {
  initialProfileActionState,
} from "@/features/settings/types/profile-action-state";
import type { Profile } from "@/types/profile";

type NotificationsSettingsSectionProps = Readonly<{
  profile: Profile;
}>;

export function NotificationsSettingsSection({
  profile,
}: NotificationsSettingsSectionProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    updateProfileNotifications,
    initialProfileActionState,
  );
  const [inAppNotificationsEnabled, setInAppNotificationsEnabled] = useState(
    profile.inAppNotificationsEnabled,
  );
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(
    profile.emailNotificationsEnabled,
  );
  const [mentionsOnlyMode, setMentionsOnlyMode] = useState(profile.mentionsOnlyMode);

  useEffect(() => {
    if (!state.success) {
      return;
    }

    router.refresh();
  }, [router, state.success]);

  return (
    <SettingsCard
      id="notifications"
      label="Notifications"
      title="Alert routing"
      description="Choose which updates should reach you inside Registruum and by email."
    >
      <form action={formAction} className="space-y-4">
        <div className="space-y-3">
          <SettingsToggle
            label="In-app notifications"
            description="Receive updates directly inside the workspace."
            checked={inAppNotificationsEnabled}
            onCheckedChange={setInAppNotificationsEnabled}
          />
          <input
            type="hidden"
            name="inAppNotificationsEnabled"
            value={inAppNotificationsEnabled ? "true" : "false"}
          />

          <SettingsToggle
            label="Email notifications"
            description="Saved now and ready for delivery when outbound email is connected."
            checked={emailNotificationsEnabled}
            onCheckedChange={setEmailNotificationsEnabled}
          />
          <input
            type="hidden"
            name="emailNotificationsEnabled"
            value={emailNotificationsEnabled ? "true" : "false"}
          />

          <SettingsToggle
            label="Mentions only mode"
            description="Limit alerts to direct mentions and explicit assignments."
            checked={mentionsOnlyMode}
            onCheckedChange={setMentionsOnlyMode}
          />
          <input
            type="hidden"
            name="mentionsOnlyMode"
            value={mentionsOnlyMode ? "true" : "false"}
          />
        </div>

        <FormMessage
          message={state.error ?? state.success}
          tone={state.error ? "error" : "info"}
        />

        <div className="flex justify-end border-t border-border pt-4">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isPending ? "Saving..." : "Save Notifications"}
          </button>
        </div>
      </form>
    </SettingsCard>
  );
}
