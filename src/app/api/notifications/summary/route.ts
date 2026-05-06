import { NextResponse } from "next/server";
import { getAuthenticatedAppUserOrNull } from "@/features/auth/api/profiles";
import { listPendingInvitationsForUser } from "@/features/settings/api/invitations";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatDateTimeLabel } from "@/lib/utils";
import { sanitizePersonDisplayName } from "@/lib/utils";

type MentionNotification = Readonly<{
  id: string;
  actorName: string;
  spaceId: string;
  workOrderId: string | null;
  entityId: string | null;
  summary: string;
  createdAt: string;
}>;

export async function GET() {
  const ctx = await getAuthenticatedAppUserOrNull();

  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const adminSupabase = createSupabaseAdminClient();
    const invitations = await listPendingInvitationsForUser(ctx);
    const { data: mentionRows, error: mentionError } = await adminSupabase
      .from("activity_logs")
      .select("id, actor_user_id, space_id, work_order_id, entity_id, created_at, details")
      .eq("action", "Mentioned you in chat")
      .eq("details->>mentioned_user_id", ctx.user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (mentionError) {
      throw new Error(mentionError.message);
    }

    const actorIds = [
      ...new Set(
        (mentionRows ?? [])
          .map((row) => row.actor_user_id)
          .filter((value): value is string => Boolean(value)),
      ),
    ];
    const { data: actorProfiles, error: actorError } = actorIds.length
      ? await adminSupabase.from("profiles").select("id, full_name").in("id", actorIds)
      : { data: [], error: null };

    if (actorError) {
      throw new Error(actorError.message);
    }

    const actorNameById = new Map(
      (actorProfiles ?? []).map((profile) => [
        profile.id,
        sanitizePersonDisplayName(profile.full_name ?? "Unknown User"),
      ]),
    );
    const mentions: MentionNotification[] = (mentionRows ?? []).map((row) => {
      const details =
        row.details && typeof row.details === "object" && !Array.isArray(row.details)
          ? row.details
          : {};
      const summary =
        typeof details.summary === "string" && details.summary.length > 0
          ? details.summary
          : "Mentioned you in chat";

      return {
        id: row.id,
        actorName: actorNameById.get(row.actor_user_id ?? "") ?? "Unknown User",
        spaceId: row.space_id,
        workOrderId: row.work_order_id,
        entityId: row.entity_id,
        summary,
        createdAt: formatDateTimeLabel(row.created_at),
      };
    });

    return NextResponse.json({ invitations, mentions });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load notifications.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
