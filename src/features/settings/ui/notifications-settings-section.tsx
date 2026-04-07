"use client";

import { useActionState, useEffect, useState } from "react";
import { BellRing, MailOpen, MessageSquareText } from "lucide-react";
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
      description="Choose how activity should reach you across the workspace, inbox, and direct mentions."
    >
      <form action={formAction} className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[1.4rem] border border-border bg-panel-muted px-4 py-4">
            <div className="flex items-center gap-2">
              <BellRing className="h-4 w-4 text-accent" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
                In-App
              </p>
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">
              {inAppNotificationsEnabled ? "Enabled" : "Muted"}
            </p>
          </div>
          <div className="rounded-[1.4rem] border border-border bg-panel-muted px-4 py-4">
            <div className="flex items-center gap-2">
              <MailOpen className="h-4 w-4 text-accent" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
                Email
              </p>
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">
              {emailNotificationsEnabled ? "Enabled" : "Muted"}
            </p>
          </div>
          <div className="rounded-[1.4rem] border border-border bg-panel-muted px-4 py-4">
            <div className="flex items-center gap-2">
              <MessageSquareText className="h-4 w-4 text-accent" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
                Mentions
              </p>
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">
              {mentionsOnlyMode ? "Mentions only" : "All activity"}
            </p>
          </div>
        </div>

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
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-accent px-5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(31,95,255,0.24)] disabled:opacity-60 dark:shadow-none"
          >
            {isPending ? "Saving..." : "Save Notifications"}
          </button>
        </div>
      </form>
    </SettingsCard>
  );
}
