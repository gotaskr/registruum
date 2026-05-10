import { NextResponse } from "next/server";
import { getAuthenticatedAppUserOrNull } from "@/features/auth/api/profiles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const ctx = await getAuthenticatedAppUserOrNull();

  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const adminSupabase = createSupabaseAdminClient();
    const viewedAt = new Date().toISOString();
    const { error } = await adminSupabase
      .from("profiles")
      .update({
        notifications_last_viewed_at: viewedAt,
        updated_at: viewedAt,
      })
      .eq("id", ctx.user.id);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true as const });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update notifications.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
