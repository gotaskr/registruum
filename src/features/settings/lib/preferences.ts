export const themeCookieName = "registruum-theme";

export const themeOptions = ["light", "dark"] as const;
export const landingPageOptions = ["last_space", "dashboard"] as const;
export const timezoneOptions = [
  "America/Edmonton",
  "America/New_York",
  "UTC",
] as const;
export const dateFormatOptions = [
  "YYYY-MM-DD",
  "MM/DD/YYYY",
  "DD/MM/YYYY",
] as const;

export type ThemePreference = (typeof themeOptions)[number];
export type DefaultLandingPage = (typeof landingPageOptions)[number];
export type SupportedTimezone = (typeof timezoneOptions)[number];
export type SupportedDateFormat = (typeof dateFormatOptions)[number];

export function resolveThemePreference(value: string | null | undefined): ThemePreference {
  return value === "dark" ? "dark" : "light";
}

