"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireAuthenticatedAppUser } from "@/features/auth/api/profiles";
import {
  themeCookieName,
  type ThemePreference,
} from "@/features/settings/lib/preferences";
import { updatePreferencesSchema } from "@/features/settings/schemas/preferences.schema";
import {
  initialProfileActionState,
  type ProfileActionState,
} from "@/features/settings/types/profile-action-state";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function persistThemeCookie(themePreference: ThemePreference) {
  const cookieStore = await cookies();
  cookieStore.set(themeCookieName, themePreference, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function updateProfilePreferences(
  previousState: ProfileActionState = initialProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  void previousState;
  const parsed = updatePreferencesSchema.safeParse({
    themePreference: readText(formData, "themePreference"),
    defaultLandingPage: readText(formData, "defaultLandingPage"),
    timezone: readText(formData, "timezone"),
    dateFormat: readText(formData, "dateFormat"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Unable to update preferences.",
    };
  }

  const { supabase, profile } = await requireAuthenticatedAppUser();
  const { error } = await supabase
    .from("profiles")
    .update({
      theme_preference: parsed.data.themePreference,
      default_landing_page: parsed.data.defaultLandingPage,
      timezone: parsed.data.timezone,
      date_format: parsed.data.dateFormat,
    })
    .eq("id", profile.id);

  if (error) {
    return {
      error: error.message,
    };
  }

  await persistThemeCookie(parsed.data.themePreference);

  revalidatePath("/");
  revalidatePath("/settings");

  return {
    success: "Preferences updated.",
  };
}
