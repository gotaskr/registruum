"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatAuthReachabilityError } from "@/features/auth/lib/format-auth-reachability-error";
import { signInSchema } from "@/features/auth/schemas/auth.schema";
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

  let data: Awaited<
    ReturnType<typeof supabase.auth.signInWithPassword>
  >["data"];
  try {
    const result = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    data = result.data;
    if (result.error) {
      return {
        error: formatAuthReachabilityError(result.error.message),
      };
    }
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    return {
      error: formatAuthReachabilityError(message),
    };
  }

  if (data.user) {
    await syncProfileFromAuthUser(supabase, data.user);
  }

  redirect(parsed.data.next ?? "/");
}

/** Sync profile from the current session (cookies). Used after browser `signUp` when email is already confirmed. */
export async function syncProfileFromCurrentSession() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await syncProfileFromAuthUser(supabase, user);
  }
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
