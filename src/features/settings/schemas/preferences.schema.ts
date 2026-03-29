import { z } from "zod";
import {
  dateFormatOptions,
  landingPageOptions,
  themeOptions,
  timezoneOptions,
} from "@/features/settings/lib/preferences";

export const updatePreferencesSchema = z.object({
  themePreference: z.enum(themeOptions, {
    error: "Select a valid theme.",
  }),
  defaultLandingPage: z.enum(landingPageOptions, {
    error: "Select a valid landing page.",
  }),
  timezone: z.enum(timezoneOptions, {
    error: "Select a valid timezone.",
  }),
  dateFormat: z.enum(dateFormatOptions, {
    error: "Select a valid date format.",
  }),
});
