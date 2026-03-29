"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FormMessage } from "@/features/auth/ui/form-message";
import { updateProfilePreferences } from "@/features/settings/actions/preferences.actions";
import {
  dateFormatOptions,
  landingPageOptions,
  themeCookieName,
  timezoneOptions,
  type DefaultLandingPage,
  type SupportedDateFormat,
  type SupportedTimezone,
  type ThemePreference,
} from "@/features/settings/lib/preferences";
import { SettingsCard } from "@/features/settings/ui/settings-card";
import {
  initialProfileActionState,
} from "@/features/settings/types/profile-action-state";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/profile";

type PreferencesSettingsSectionProps = Readonly<{
  profile: Profile;
  currentTheme: ThemePreference;
}>;

const landingPageLabels: Record<DefaultLandingPage, string> = {
  last_space: "Last Space",
  dashboard: "Dashboard",
};

export function PreferencesSettingsSection({
  profile,
  currentTheme,
}: PreferencesSettingsSectionProps) {
  const router = useRouter();
  const initialThemePreference = currentTheme ?? profile.themePreference ?? "light";
  const [state, formAction, isPending] = useActionState(
    updateProfilePreferences,
    initialProfileActionState,
  );
  const [themePreference, setThemePreference] = useState<ThemePreference>(
    initialThemePreference,
  );
  const [defaultLandingPage, setDefaultLandingPage] =
    useState<DefaultLandingPage>(profile.defaultLandingPage);
  const [timezone, setTimezone] = useState<SupportedTimezone>(profile.timezone);
  const [dateFormat, setDateFormat] = useState<SupportedDateFormat>(profile.dateFormat);

  useEffect(() => {
    document.documentElement.dataset.theme = themePreference;
    document.cookie = `${themeCookieName}=${themePreference}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  }, [themePreference]);

  useEffect(() => {
    if (!state.success) {
      return;
    }

    router.refresh();
  }, [router, state.success]);

  return (
    <SettingsCard
      id="preferences"
      label="Preferences"
      title="Workspace defaults"
      description="Set the default presentation and regional behavior for your session."
    >
      <form action={formAction} className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-border bg-panel-muted px-3 py-3">
          <span className="text-sm font-medium text-foreground">Theme</span>
          <div className="inline-flex rounded-lg border border-border bg-panel p-1">
            {(["light", "dark"] as const).map((themeOption) => (
              <button
                key={themeOption}
                type="button"
                onClick={() => setThemePreference(themeOption)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  themePreference === themeOption
                    ? "bg-slate-950 text-white"
                    : "text-muted hover:text-foreground",
                )}
              >
                {themeOption === "light" ? "Light" : "Dark"}
              </button>
            ))}
          </div>
          <input
            type="hidden"
            name="themePreference"
            value={themePreference ?? initialThemePreference}
          />
        </div>

        <label className="flex items-center justify-between rounded-lg border border-border bg-panel-muted px-3 py-3">
          <span className="text-sm font-medium text-foreground">Default Landing Page</span>
          <select
            name="defaultLandingPage"
            value={defaultLandingPage}
            onChange={(event) =>
              setDefaultLandingPage(event.target.value as DefaultLandingPage)
            }
            className="h-9 rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none"
          >
            {landingPageOptions.map((option) => (
              <option key={option} value={option}>
                {landingPageLabels[option]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center justify-between rounded-lg border border-border bg-panel-muted px-3 py-3">
          <span className="text-sm font-medium text-foreground">Timezone</span>
          <select
            name="timezone"
            value={timezone}
            onChange={(event) => setTimezone(event.target.value as SupportedTimezone)}
            className="h-9 rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none"
          >
            {timezoneOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center justify-between rounded-lg border border-border bg-panel-muted px-3 py-3">
          <span className="text-sm font-medium text-foreground">Date Format</span>
          <select
            name="dateFormat"
            value={dateFormat}
            onChange={(event) => setDateFormat(event.target.value as SupportedDateFormat)}
            className="h-9 rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none"
          >
            {dateFormatOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

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
            {isPending ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </form>
    </SettingsCard>
  );
}
