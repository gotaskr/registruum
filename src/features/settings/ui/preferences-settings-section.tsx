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
      <form action={formAction} className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[1.4rem] border border-border bg-panel-muted px-4 py-4">
            <div className="flex items-center gap-2">
              <MoonStar className="h-4 w-4 text-accent" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
                Theme
              </p>
            </div>
            <p className="mt-3 text-sm font-medium capitalize text-foreground">{themePreference}</p>
          </div>
          <div className="rounded-[1.4rem] border border-border bg-panel-muted px-4 py-4">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-accent" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
                Landing
              </p>
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">
              {landingPageLabels[defaultLandingPage]}
            </p>
          </div>
          <div className="rounded-[1.4rem] border border-border bg-panel-muted px-4 py-4">
            <div className="flex items-center gap-2">
              <TimerReset className="h-4 w-4 text-accent" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
                Timezone
              </p>
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">{timezone}</p>
          </div>
        </div>

        <div className="rounded-[1.6rem] border border-border bg-panel-muted px-4 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-base font-semibold text-foreground">Theme</p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Switch the application mood across the workspace shell.
              </p>
            </div>
            <div className="inline-flex rounded-2xl border border-border bg-panel p-1">
              {(["light", "dark"] as const).map((themeOption) => (
                <button
                  key={themeOption}
                  type="button"
                  onClick={() => setThemePreference(themeOption)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-[1rem] px-4 py-2 text-sm font-medium transition-colors",
                    themePreference === themeOption
                      ? "bg-accent text-white shadow-[0_12px_24px_rgba(31,95,255,0.22)]"
                      : "text-muted hover:bg-panel-muted hover:text-foreground",
                  )}
                >
                  {themeOption === "light" ? (
                    <SunMedium className="h-4 w-4" />
                  ) : (
                    <MoonStar className="h-4 w-4" />
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

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 rounded-[1.6rem] border border-border bg-panel-muted px-4 py-4">
            <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
              <LayoutGrid className="h-4 w-4 text-accent" />
              Default Landing Page
            </span>
            <select
              name="defaultLandingPage"
              value={defaultLandingPage}
              onChange={(event) =>
                setDefaultLandingPage(event.target.value as DefaultLandingPage)
              }
              className="h-12 w-full rounded-2xl border border-border bg-panel px-4 text-sm text-foreground outline-none"
            >
              {landingPageOptions.map((option) => (
                <option key={option} value={option}>
                  {landingPageLabels[option]}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 rounded-[1.6rem] border border-border bg-panel-muted px-4 py-4">
            <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
              <TimerReset className="h-4 w-4 text-accent" />
              Timezone
            </span>
            <select
              name="timezone"
              value={timezone}
              onChange={(event) => setTimezone(event.target.value as SupportedTimezone)}
              className="h-12 w-full rounded-2xl border border-border bg-panel px-4 text-sm text-foreground outline-none"
            >
              {timezoneOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="md:max-w-[26rem]">
          <label className="block space-y-2 rounded-[1.6rem] border border-border bg-panel-muted px-4 py-4">
            <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
              <CalendarDays className="h-4 w-4 text-accent" />
              Date Format
            </span>
            <select
              name="dateFormat"
              value={dateFormat}
              onChange={(event) => setDateFormat(event.target.value as SupportedDateFormat)}
              className="h-12 w-full rounded-2xl border border-border bg-panel px-4 text-sm text-foreground outline-none"
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

        <div className="flex justify-end border-t border-border pt-4">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-accent px-5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(31,95,255,0.24)] disabled:opacity-60"
          >
            {isPending ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </form>
    </SettingsCard>
  );
}
