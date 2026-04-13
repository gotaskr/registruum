import "server-only";

import { redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { resolveThemePreference } from "@/features/settings/lib/preferences";
import { profileAvatarBucket } from "@/features/settings/lib/profile-avatar-storage";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { Profile } from "@/types/profile";

type ServerSupabaseClient = SupabaseClient<Database>;
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

function buildFallbackUserTag(profileId: string) {
  return `#${profileId.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

function getUserProviders(user: User) {
  const providers = user.app_metadata.providers;
  return Array.isArray(providers)
    ? providers.filter((value): value is string => typeof value === "string")
    : [];
}

async function resolveProfileAvatarUrl(
  supabase: ServerSupabaseClient,
  avatarPath: string | null,
) {
  if (!avatarPath) {
    return null;
  }

  const { data, error } = await supabase.storage
    .from(profileAvatarBucket)
    .createSignedUrl(avatarPath, 60 * 60);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}

async function mapProfileRow(
  supabase: ServerSupabaseClient,
  row: ProfileRow,
  user: User,
): Promise<Profile> {
  const providers = getUserProviders(user);

  return {
    id: row.id,
    userTag: row.user_tag ?? buildFallbackUserTag(row.id),
    canManagePassword: providers.includes("email"),
    themePreference: resolveThemePreference(row.theme_preference),
    defaultLandingPage:
      row.default_landing_page === "last_space" ? "last_space" : "dashboard",
    timezone:
      row.timezone === "America/New_York" || row.timezone === "UTC"
        ? row.timezone
        : "America/Edmonton",
    dateFormat:
      row.date_format === "MM/DD/YYYY" || row.date_format === "DD/MM/YYYY"
        ? row.date_format
        : "YYYY-MM-DD",
    inAppNotificationsEnabled: row.in_app_notifications_enabled,
    emailNotificationsEnabled: row.email_notifications_enabled,
    mentionsOnlyMode: row.mentions_only_mode,
    fullName: row.full_name,
    email: row.email,
    emailVerifiedAt: row.email_verified_at,
    displayName: row.display_name,
    additionalEmails: row.additional_emails ?? [],
    contactInfo: row.contact_info,
    avatarPath: row.avatar_path,
    avatarFileName: row.avatar_file_name,
    avatarUrl: await resolveProfileAvatarUrl(supabase, row.avatar_path),
    representsCompany: row.represents_company,
    companyName: row.company_name,
    companyEmail: row.company_email,
    companyAddress: row.company_address,
    companyWebsite: row.company_website,
    companyFacebookUrl: row.company_facebook_url,
    companyXUrl: row.company_x_url,
    companyInstagramUrl: row.company_instagram_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function syncProfileFromAuthUser(
  supabase: ServerSupabaseClient,
  user: User,
) {
  const fullName =
    typeof user.user_metadata.full_name === "string" && user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name.trim()
      : user.email?.split("@")[0] ?? "Registruum User";

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        full_name: fullName,
        email: user.email ?? "",
        email_verified_at: user.email_confirmed_at ?? null,
      },
      {
        onConflict: "id",
      },
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapProfileRow(supabase, data as ProfileRow, user);
}

export async function requireAuthenticatedAppUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const profile = await syncProfileFromAuthUser(supabase, user);

  return {
    supabase,
    user,
    profile,
  };
}

/** Same session payload as {@link requireAuthenticatedAppUser} without redirecting (for Route Handlers). */
export async function getAuthenticatedAppUserOrNull() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const profile = await syncProfileFromAuthUser(supabase, user);

  return {
    supabase,
    user,
    profile,
  };
}

export async function getCurrentProfile() {
  const { profile } = await requireAuthenticatedAppUser();
  return profile;
}
