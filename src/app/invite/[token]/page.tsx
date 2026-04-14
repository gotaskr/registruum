import { notFound } from "next/navigation";
import { getWorkOrderInviteByToken } from "@/features/invitations/api/work-order-invite";
import { WorkOrderInviteResponse } from "@/features/invitations/ui/work-order-invite-response";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatRoleLabel } from "@/lib/utils";
import { Users, Clock, ShieldCheck } from "lucide-react";

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
  const isWorkOrderInvite = Boolean(invite.workOrderId);
  const isOwnInvite = Boolean(user?.id && user.id === invite.invitedByUserId);

  return (
    <main className="flex min-h-screen items-start justify-center bg-background px-4 py-8 sm:items-center sm:py-12">
      <div className="w-full max-w-md space-y-5">
        <div className="rounded-[1.75rem] border border-border bg-panel p-5 shadow-[0_20px_50px_rgba(15,23,42,0.07)] sm:p-7">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Users className="h-4 w-4" />
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-accent">
              {isWorkOrderInvite ? "Work Order Invite" : "Team Invite"}
            </p>
          </div>

          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {invite.workOrderTitle ?? `Join ${invite.spaceName}`}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Invited by <span className="font-medium text-foreground">{invite.invitedByName}</span>
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border bg-panel-muted px-4 py-3.5">
              <ShieldCheck className="h-4 w-4 text-accent" />
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                Role
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {formatRoleLabel(invite.role)}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-panel-muted px-4 py-3.5">
              <Clock className="h-4 w-4 text-muted" />
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                Expires
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">{invite.expiresAt}</p>
            </div>
          </div>

          {!isPending ? (
            <div className="mt-5 rounded-2xl border border-border bg-panel-muted px-4 py-4 text-center">
              <p className="text-sm font-semibold text-foreground">Invitation no longer available</p>
              <p className="mt-1 text-xs text-muted">
                It may have been accepted, revoked, or expired.
              </p>
            </div>
          ) : (
            <div className="mt-6">
              <WorkOrderInviteResponse
                token={token}
                isAuthenticated={Boolean(user)}
                autoAccept={Boolean(user) && intent === "accept" && !isOwnInvite}
                isOwnInvite={isOwnInvite}
              />
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted">
          {invite.spaceName} on Registruum
        </p>
      </div>
    </main>
  );
}
