import { NextResponse } from "next/server";
import { getAuthenticatedAppUserOrNull } from "@/features/auth/api/profiles";
import {
  globalSearchForSession,
  parseGlobalSearchQuery,
} from "@/features/search/api/global-search";

export async function GET(request: Request) {
  const ctx = await getAuthenticatedAppUserOrNull();

  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const raw = url.searchParams.get("q") ?? "";
  const normalized = parseGlobalSearchQuery(raw);

  if (!normalized) {
    return NextResponse.json(
      {
        error: "Enter at least 2 characters to search (max 80).",
      },
      { status: 400 },
    );
  }

  try {
    const payload = await globalSearchForSession(ctx, normalized);
    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to run search.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
