import { notFound } from "next/navigation";
import { getWorkOrderInviteByToken } from "@/features/invitations/api/work-order-invite";
import { WorkOrderInviteResponse } from "@/features/invitations/ui/work-order-invite-response";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type InvitePageProps = Readonly<{
  params: Promise<{
    token: string;
  }>;
  searchParams: Promise<{
    intent?: string;
  }>;
}>;

export default async function InvitePage({
  params,
  searchParams,
}: InvitePageProps) {
  const { token } = await params;
  const { intent } = await searchParams;
  const invite = await getWorkOrderInviteByToken(token);

  if (!invite) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isPending = invite.status === "pending";

  return (
    <main className="min-h-screen bg-panel-muted px-4 py-12">
      <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-panel shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
        <div className="border-b border-border px-6 py-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
            Work Order Invite
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
            {invite.workOrderTitle ?? "Join this work order"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            Invited by {invite.invitedByName} in {invite.spaceName}
          </p>
        </div>

        <div className="space-y-6 px-6 py-6">
          <div className="grid gap-4 rounded-2xl border border-border bg-panel-muted px-5 py-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                Access
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">Member</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                Expires
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">{invite.expiresAt}</p>
            </div>
          </div>

          {!isPending ? (
            <div className="rounded-2xl border border-border bg-panel-muted px-5 py-5">
              <p className="text-base font-semibold text-foreground">This invitation is no longer available.</p>
              <p className="mt-2 text-sm text-muted">
                It may have already been accepted, revoked, or expired.
              </p>
            </div>
          ) : (
            <WorkOrderInviteResponse
              token={token}
              isAuthenticated={Boolean(user)}
              autoAccept={Boolean(user) && intent === "accept"}
            />
          )}
        </div>
      </div>
    </main>
  );
}
