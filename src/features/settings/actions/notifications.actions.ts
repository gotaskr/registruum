"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedAppUser } from "@/features/auth/api/profiles";
import { updateNotificationsSchema } from "@/features/settings/schemas/notifications.schema";
import {
  initialProfileActionState,
  type ProfileActionState,
} from "@/features/settings/types/profile-action-state";

function readBoolean(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "true" || value === "on";
}

export async function updateProfileNotifications(
  previousState: ProfileActionState = initialProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  void previousState;
  const parsed = updateNotificationsSchema.safeParse({
    inAppNotificationsEnabled: readBoolean(formData, "inAppNotificationsEnabled"),
    emailNotificationsEnabled: readBoolean(formData, "emailNotificationsEnabled"),
    mentionsOnlyMode: readBoolean(formData, "mentionsOnlyMode"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Unable to update notification settings.",
    };
  }

  const { supabase, profile } = await requireAuthenticatedAppUser();
  const { error } = await supabase
    .from("profiles")
    .update({
      in_app_notifications_enabled: parsed.data.inAppNotificationsEnabled,
      email_notifications_enabled: parsed.data.emailNotificationsEnabled,
      mentions_only_mode: parsed.data.mentionsOnlyMode,
    })
    .eq("id", profile.id);

  if (error) {
    return {
      error: error.message,
    };
  }

  revalidatePath("/settings");

  return {
    success: "Notification settings updated.",
  };
}
