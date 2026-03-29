import { NextResponse } from "next/server";
import { syncProfileFromAuthUser } from "@/features/auth/api/profiles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(new URL("/sign-in?message=Missing+auth+code", request.url));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(`/sign-in?message=${encodeURIComponent(error.message)}`, request.url));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await syncProfileFromAuthUser(supabase, user);
  }

  return NextResponse.redirect(new URL(next, request.url));
}
