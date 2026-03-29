"use server";

import { redirect } from "next/navigation";
import { requireAuthenticatedAppUser } from "@/features/auth/api/profiles";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updatePasswordSchema } from "@/features/settings/schemas/security.schema";
import {
  initialSecurityActionState,
  type SecurityActionState,
} from "@/features/settings/types/security-action-state";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function updatePassword(
  previousState: SecurityActionState = initialSecurityActionState,
  formData: FormData,
): Promise<SecurityActionState> {
  void previousState;
  const parsed = updatePasswordSchema.safeParse({
    currentPassword: readText(formData, "currentPassword"),
    newPassword: readText(formData, "newPassword"),
    confirmPassword: readText(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Unable to update password.",
    };
  }

  const { user } = await requireAuthenticatedAppUser();

  if (!user.email) {
    return {
      error: "This account does not have an email login.",
    };
  }

  const verificationClient = await createSupabaseServerClient();
  const { error: signInError } = await verificationClient.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });

  if (signInError) {
    return {
      error: "Current password is incorrect.",
    };
  }

  const { error: updateError } = await verificationClient.auth.updateUser({
    password: parsed.data.newPassword,
  });

  if (updateError) {
    return {
      error: updateError.message,
    };
  }

  return {
    success: "Password updated.",
  };
}

export async function signOutAllDevices() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut({ scope: "global" });
  redirect("/sign-in");
}
