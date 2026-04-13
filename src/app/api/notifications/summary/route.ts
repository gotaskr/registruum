import { NextResponse } from "next/server";
import { getAuthenticatedAppUserOrNull } from "@/features/auth/api/profiles";
import { listPendingInvitationsForUser } from "@/features/settings/api/invitations";

export async function GET() {
  const ctx = await getAuthenticatedAppUserOrNull();

  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const invitations = await listPendingInvitationsForUser(ctx);
    return NextResponse.json({ invitations });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load notifications.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
