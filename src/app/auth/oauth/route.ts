import { NextResponse } from "next/server";
import type { Provider } from "@supabase/supabase-js";
import { isSocialAuthEnabled } from "@/features/auth/lib/social-auth-availability";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const providerMap = {
  google: "google",
  linkedin: "linkedin_oidc",
} as const satisfies Record<string, Provider>;

function resolveIntent(value: string | null) {
  return value === "sign-up" ? "sign-up" : "sign-in";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const providerKey = url.searchParams.get("provider");
  const next = url.searchParams.get("next");
  const intent = resolveIntent(url.searchParams.get("intent"));

  if (!isSocialAuthEnabled()) {
    return NextResponse.redirect(
      new URL(
        `/${intent}?message=${encodeURIComponent("Social sign-in is only available on the production site. Use email and password here.")}`,
        request.url,
      ),
    );
  }

  const provider = providerKey ? providerMap[providerKey as keyof typeof providerMap] : null;

  if (!provider) {
    return NextResponse.redirect(
      new URL(`/${intent}?message=${encodeURIComponent("Selected social provider is not available.")}`, request.url),
    );
  }

  const callbackUrl = new URL("/auth/callback", request.url);
  if (next) {
    callbackUrl.searchParams.set("next", next);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: callbackUrl.toString(),
    },
  });

  if (error || !data.url) {
    return NextResponse.redirect(
      new URL(
        `/${intent}?message=${encodeURIComponent(
          error?.message ?? "Unable to start social sign in.",
        )}`,
        request.url,
      ),
    );
  }

  return NextResponse.redirect(data.url);
}
