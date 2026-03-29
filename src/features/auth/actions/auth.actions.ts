"use server";

import { redirect } from "next/navigation";
import { appUrl } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signInSchema, signUpSchema } from "@/features/auth/schemas/auth.schema";
import {
  initialAuthActionState,
  type AuthActionState,
} from "@/features/auth/types/auth-action-state";
import { syncProfileFromAuthUser } from "@/features/auth/api/profiles";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function signIn(
  previousState: AuthActionState = initialAuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  void previousState;
  const parsed = signInSchema.safeParse({
    email: readText(formData, "email"),
    password: readText(formData, "password"),
    next: readText(formData, "next") || undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Unable to sign in.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      error: error.message,
    };
  }

  if (data.user) {
    await syncProfileFromAuthUser(supabase, data.user);
  }

  redirect(parsed.data.next ?? "/");
}

export async function signUp(
  previousState: AuthActionState = initialAuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  void previousState;
  const parsed = signUpSchema.safeParse({
    fullName: readText(formData, "fullName"),
    email: readText(formData, "email"),
    password: readText(formData, "password"),
    confirmPassword: readText(formData, "confirmPassword"),
    next: readText(formData, "next") || undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Unable to create your account.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const callbackUrl = new URL("/auth/callback", appUrl);

  if (parsed.data.next) {
    callbackUrl.searchParams.set("next", parsed.data.next);
  }

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: callbackUrl.toString(),
      data: {
        full_name: parsed.data.fullName,
      },
    },
  });

  if (error) {
    return {
      error: error.message,
    };
  }

  if (data.session && data.user) {
    await syncProfileFromAuthUser(supabase, data.user);
    redirect(parsed.data.next ?? "/");
  }

  const signInUrl = new URL("/sign-in", appUrl);
  signInUrl.searchParams.set(
    "message",
    "Check your email to verify your account before signing in.",
  );

  if (parsed.data.next) {
    signInUrl.searchParams.set("next", parsed.data.next);
  }

  redirect(signInUrl.toString());
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
