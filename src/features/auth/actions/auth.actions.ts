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
import { supabaseUrl } from "@/lib/supabase/env";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function formatAuthReachabilityError(message: string) {
  const lower = message.toLowerCase();
  const looksLikeNetwork =
    lower === "fetch failed" ||
    lower.includes("failed to fetch") ||
    lower.includes("network") ||
    lower.includes("econnrefused") ||
    lower.includes("socket") ||
    lower.includes("und_err_socket");

  if (!looksLikeNetwork) {
    return message;
  }

  const target = supabaseUrl;
  const isLocal =
    target.includes("127.0.0.1") ||
    target.includes("localhost") ||
    target.includes("192.168.") ||
    target.includes("10.");

  if (isLocal) {
    return [
      "The app could not reach your local Supabase API.",
      `Configured URL: ${target}`,
      "Restart the stack: npx supabase stop && npx supabase start (needed after changing supabase/config.toml).",
      "Restart Next.js (npm run dev) so it reloads .env.local.",
      "Diagnostics: npm run verify:local-supabase — if you see GoTrue JSON, Supabase is healthy inside Docker and the problem is host port publishing.",
      "On Windows with Docker Desktop: fully quit Docker Desktop and start it again (fixes empty replies / fetch failed to 127.0.0.1:54321). Prefer http://127.0.0.1:54321 over localhost in NEXT_PUBLIC_SUPABASE_URL.",
    ].join(" ");
  }

  return [
    "The app could not reach Supabase (network error).",
    `Configured URL: ${target}`,
    "Check the URL, your internet connection, and whether a firewall or VPN is blocking outbound HTTPS.",
  ].join(" ");
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

  let data: Awaited<ReturnType<typeof supabase.auth.signUp>>["data"];
  try {
    const result = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: callbackUrl.toString(),
        data: {
          full_name: parsed.data.fullName,
        },
      },
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

  const emailConfirmed = !!data.user?.email_confirmed_at;

  if (data.session && data.user && emailConfirmed) {
    await syncProfileFromAuthUser(supabase, data.user);
    redirect(parsed.data.next ?? "/");
  }

  const verifyEmailUrl = new URL("/verify-email", appUrl);
  verifyEmailUrl.searchParams.set("email", parsed.data.email);

  if (parsed.data.next) {
    verifyEmailUrl.searchParams.set("next", parsed.data.next);
  }

  redirect(verifyEmailUrl.toString());
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
