"use client";

import { useActionState, useEffect, useState } from "react";
import { CalendarDays, LayoutGrid, MoonStar, SunMedium, TimerReset } from "lucide-react";
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
      description="Choose how Registruum should look and behave every time you come back."
    >
      <form action={formAction} className="space-y-3 sm:space-y-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
          <div className="rounded-xl border border-border bg-panel-muted px-3 py-3 sm:rounded-[1.4rem] sm:px-4 sm:py-4">
            <div className="flex items-center gap-2">
              <MoonStar className="h-4 w-4 shrink-0 text-accent" />
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted sm:text-[11px] sm:tracking-[0.22em]">
                Theme
              </p>
            </div>
            <p className="mt-2 text-sm font-medium capitalize text-foreground sm:mt-3">
              {themePreference}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-panel-muted px-3 py-3 sm:rounded-[1.4rem] sm:px-4 sm:py-4">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 shrink-0 text-accent" />
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted sm:text-[11px] sm:tracking-[0.22em]">
                Landing
              </p>
            </div>
            <p className="mt-2 text-sm font-medium text-foreground sm:mt-3">
              {landingPageLabels[defaultLandingPage]}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-panel-muted px-3 py-3 sm:rounded-[1.4rem] sm:px-4 sm:py-4">
            <div className="flex items-center gap-2">
              <TimerReset className="h-4 w-4 shrink-0 text-accent" />
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted sm:text-[11px] sm:tracking-[0.22em]">
                Timezone
              </p>
            </div>
            <p className="mt-2 break-all text-sm font-medium leading-snug text-foreground sm:mt-3">
              {timezone}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-panel-muted px-3 py-3 sm:rounded-[1.6rem] sm:px-4 sm:py-4">
          <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground sm:text-base">Theme</p>
              <p className="mt-1 text-xs leading-relaxed text-muted sm:text-sm sm:leading-6">
                Switch the application mood across the workspace shell.
              </p>
            </div>
            <div className="flex w-full shrink-0 rounded-xl border border-border bg-panel p-1 sm:w-auto sm:rounded-2xl">
              {(["light", "dark"] as const).map((themeOption) => (
                <button
                  key={themeOption}
                  type="button"
                  onClick={() => setThemePreference(themeOption)}
                  className={cn(
                    "inline-flex min-h-11 flex-1 touch-manipulation items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors sm:min-h-0 sm:flex-none sm:rounded-[1rem] sm:px-4 sm:py-2",
                    themePreference === themeOption
                      ? "bg-accent text-white shadow-[0_12px_24px_rgba(31,95,255,0.22)]"
                      : "text-muted hover:bg-panel-muted hover:text-foreground",
                  )}
                >
                  {themeOption === "light" ? (
                    <SunMedium className="h-4 w-4 shrink-0" />
                  ) : (
                    <MoonStar className="h-4 w-4 shrink-0" />
                  )}
                  {themeOption === "light" ? "Light" : "Dark"}
                </button>
              ))}
            </div>
          </div>
          <input
            type="hidden"
            name="themePreference"
            value={themePreference ?? initialThemePreference}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
          <label className="space-y-2 rounded-2xl border border-border bg-panel-muted px-3 py-3 sm:rounded-[1.6rem] sm:px-4 sm:py-4">
            <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-muted sm:text-[11px] sm:tracking-[0.24em]">
              <LayoutGrid className="h-4 w-4 shrink-0 text-accent" />
              Default Landing Page
            </span>
            <select
              name="defaultLandingPage"
              value={defaultLandingPage}
              onChange={(event) =>
                setDefaultLandingPage(event.target.value as DefaultLandingPage)
              }
              className="h-12 w-full rounded-xl border border-border bg-panel px-4 text-sm text-foreground outline-none transition focus:border-accent sm:rounded-2xl"
            >
              {landingPageOptions.map((option) => (
                <option key={option} value={option}>
                  {landingPageLabels[option]}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 rounded-2xl border border-border bg-panel-muted px-3 py-3 sm:rounded-[1.6rem] sm:px-4 sm:py-4">
            <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-muted sm:text-[11px] sm:tracking-[0.24em]">
              <TimerReset className="h-4 w-4 shrink-0 text-accent" />
              Timezone
            </span>
            <select
              name="timezone"
              value={timezone}
              onChange={(event) => setTimezone(event.target.value as SupportedTimezone)}
              className="h-12 w-full rounded-xl border border-border bg-panel px-4 text-sm text-foreground outline-none transition focus:border-accent sm:rounded-2xl"
            >
              {timezoneOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="w-full md:max-w-[26rem]">
          <label className="block space-y-2 rounded-2xl border border-border bg-panel-muted px-3 py-3 sm:rounded-[1.6rem] sm:px-4 sm:py-4">
            <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-muted sm:text-[11px] sm:tracking-[0.24em]">
              <CalendarDays className="h-4 w-4 shrink-0 text-accent" />
              Date Format
            </span>
            <select
              name="dateFormat"
              value={dateFormat}
              onChange={(event) => setDateFormat(event.target.value as SupportedDateFormat)}
              className="h-12 w-full rounded-xl border border-border bg-panel px-4 text-sm text-foreground outline-none transition focus:border-accent sm:rounded-2xl"
            >
              {dateFormatOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <FormMessage
          message={state.error ?? state.success}
          tone={state.error ? "error" : "info"}
        />

        <div className="flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:justify-end sm:pt-4">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-12 w-full touch-manipulation items-center justify-center rounded-xl bg-accent px-5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(31,95,255,0.24)] disabled:opacity-60 sm:h-11 sm:w-auto sm:rounded-2xl"
          >
            {isPending ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </form>
    </SettingsCard>
  );
}
