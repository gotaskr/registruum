"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuthenticatedAppUser } from "@/features/auth/api/profiles";
import {
  updateProfileCompanySchema,
  updateProfileDisplaySchema,
  updateProfileIdentitySchema,
} from "@/features/settings/schemas/profile.schema";
import {
  initialProfileActionState,
  type ProfileActionState,
} from "@/features/settings/types/profile-action-state";
import {
  buildProfileAvatarPath,
  profileAvatarBucket,
} from "@/features/settings/lib/profile-avatar-storage";
import { readFormDataFile } from "@/lib/form-data";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readBoolean(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "true" || value === "on";
}

function readAvatarFile(formData: FormData) {
  return readFormDataFile(formData, "avatar");
}

export async function updateProfileIdentity(
  previousState: ProfileActionState = initialProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  void previousState;
  const parsed = updateProfileIdentitySchema.safeParse({
    fullName: readText(formData, "fullName"),
    email: readText(formData, "email"),
    additionalEmails: formData.getAll("additionalEmails"),
    contactInfo: readText(formData, "contactInfo"),
  });
  const avatar = readAvatarFile(formData);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Unable to update profile identity.",
    };
  }

  if (avatar && !avatar.type.startsWith("image/")) {
    return {
      error: "Profile photo must be an image file.",
    };
  }

  const { supabase, user, profile } = await requireAuthenticatedAppUser();
  let nextAvatarPath = profile.avatarPath;
  let nextAvatarFileName = profile.avatarFileName;

  if (avatar) {
    const storagePath = buildProfileAvatarPath(profile.id, avatar.name);
    const bytes = new Uint8Array(await avatar.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from(profileAvatarBucket)
      .upload(storagePath, bytes, {
        cacheControl: "3600",
        contentType: avatar.type || undefined,
        upsert: false,
      });

    if (uploadError) {
      return {
        error: uploadError.message,
      };
    }

    nextAvatarPath = storagePath;
    nextAvatarFileName = avatar.name;
  }

  const authSupabase = await createSupabaseServerClient();
  const authUpdatePayload: {
    email?: string;
    data?: {
      full_name: string;
    };
  } = {
    data: {
      full_name: parsed.data.fullName,
    },
  };

  if (parsed.data.email !== user.email) {
    authUpdatePayload.email = parsed.data.email;
  }

  const { error: authError } = await authSupabase.auth.updateUser(authUpdatePayload);

  if (authError) {
    if (avatar && nextAvatarPath && nextAvatarPath !== profile.avatarPath) {
      await supabase.storage.from(profileAvatarBucket).remove([nextAvatarPath]);
    }

    return {
      error: authError.message,
    };
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      email: parsed.data.email,
      additional_emails: parsed.data.additionalEmails,
      contact_info: parsed.data.contactInfo,
      avatar_path: nextAvatarPath,
      avatar_file_name: nextAvatarFileName,
    })
    .eq("id", profile.id);

  if (updateError) {
    if (avatar && nextAvatarPath && nextAvatarPath !== profile.avatarPath) {
      await supabase.storage.from(profileAvatarBucket).remove([nextAvatarPath]);
    }

    return {
      error: updateError.message,
    };
  }

  if (avatar && profile.avatarPath && profile.avatarPath !== nextAvatarPath) {
    await supabase.storage.from(profileAvatarBucket).remove([profile.avatarPath]);
  }

  revalidatePath("/settings");

  return {
    success:
      parsed.data.email !== user.email
        ? "Profile updated. Email changes may require confirmation."
        : "Profile updated.",
  };
}

export async function updateProfileCompany(
  previousState: ProfileActionState = initialProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  void previousState;
  const parsed = updateProfileCompanySchema.safeParse({
    representsCompany: readBoolean(formData, "representsCompany"),
    companyName: readText(formData, "companyName"),
    companyEmail: readText(formData, "companyEmail"),
    companyAddress: readText(formData, "companyAddress"),
    companyWebsite: readText(formData, "companyWebsite"),
    companyFacebookUrl: readText(formData, "companyFacebookUrl"),
    companyXUrl: readText(formData, "companyXUrl"),
    companyInstagramUrl: readText(formData, "companyInstagramUrl"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Unable to update company details.",
    };
  }

  const { supabase, profile } = await requireAuthenticatedAppUser();
  const { error } = await supabase
    .from("profiles")
    .update({
      represents_company: parsed.data.representsCompany,
      company_name: parsed.data.representsCompany ? parsed.data.companyName : null,
      company_email: parsed.data.representsCompany ? parsed.data.companyEmail : null,
      company_address: parsed.data.representsCompany ? parsed.data.companyAddress : null,
      company_website: parsed.data.representsCompany ? parsed.data.companyWebsite : null,
      company_facebook_url: parsed.data.representsCompany
        ? parsed.data.companyFacebookUrl
        : null,
      company_x_url: parsed.data.representsCompany ? parsed.data.companyXUrl : null,
      company_instagram_url: parsed.data.representsCompany
        ? parsed.data.companyInstagramUrl
        : null,
    })
    .eq("id", profile.id);

  if (error) {
    return {
      error: error.message,
    };
  }

  revalidatePath("/settings");

  return {
    success: "Company details updated.",
  };
}

export async function updateProfileDisplayIdentity(
  previousState: ProfileActionState = initialProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  void previousState;
  const parsed = updateProfileDisplaySchema.safeParse({
    displayName: readText(formData, "displayName"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Unable to update display identity.",
    };
  }

  const { supabase, profile } = await requireAuthenticatedAppUser();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
    })
    .eq("id", profile.id);

  if (error) {
    return {
      error: error.message,
    };
  }

  revalidatePath("/settings");

  return {
    success: "Display identity updated.",
  };
}
