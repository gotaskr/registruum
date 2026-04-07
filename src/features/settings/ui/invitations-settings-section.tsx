"use client";

import { useActionState, useEffect } from "react";
import Image from "next/image";
import { CheckCircle2, Inbox, Mail, Ticket, UserPlus2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/features/auth/ui/form-message";
import {
  acceptInvitation,
  declineInvitation,
} from "@/features/settings/actions/invitations.actions";
import type { SettingsInvitation } from "@/features/settings/types/invitation";
import {
  initialInvitationActionState,
} from "@/features/settings/types/invitation-action-state";
import { SettingsCard } from "@/features/settings/ui/settings-card";
import { formatRoleLabel } from "@/lib/utils";
import type { Profile } from "@/types/profile";

type InvitationsSettingsSectionProps = Readonly<{
  invitations: SettingsInvitation[];
  profile: Profile;
}>;

const methodIconMap = {
  email: Mail,
  link: Inbox,
  code: Ticket,
} as const;

export function InvitationsSettingsSection({
  invitations,
  profile,
}: InvitationsSettingsSectionProps) {
  return (
    <SettingsCard
      id="invitations"
      label="Invitations"
      title="Pending invitations"
      description="Review space and work order access requests that are waiting on you."
    >
      {invitations.length === 0 ? (
        <div className="rounded-[1.6rem] border border-dashed border-border bg-panel-muted px-5 py-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-panel text-accent shadow-[0_12px_24px_rgba(15,23,42,0.04)] dark:shadow-none">
            <Inbox className="h-6 w-6" />
          </div>
          <p className="mt-4 text-base font-semibold text-foreground">No invitations right now</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            New space and work order invitations will appear here as soon as they arrive.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-[1.4rem] border border-border bg-panel-muted px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
                Pending
              </p>
              <p className="mt-3 text-2xl font-semibold text-foreground">{invitations.length}</p>
            </div>
            <div className="rounded-[1.4rem] border border-border bg-panel-muted px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
                Spaces
              </p>
              <p className="mt-3 text-sm font-medium text-foreground">
                {[...new Set(invitations.map((invitation) => invitation.spaceName))].length} active targets
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-border bg-panel-muted px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
                Roles
              </p>
              <p className="mt-3 text-sm font-medium text-foreground">
                {[...new Set(invitations.map((invitation) => invitation.role))].length} invitation types
              </p>
            </div>
          </div>

          {invitations.map((invitation) => {
            return (
              <InvitationCard
                key={invitation.id}
                invitation={invitation}
                profile={profile}
              />
            );
          })}
        </div>
      )}
    </SettingsCard>
  );
}

function InvitationCard({
  invitation,
  profile,
}: Readonly<{
  invitation: SettingsInvitation;
  profile: Profile;
}>) {
  const router = useRouter();
  const [acceptState, acceptAction, isAcceptPending] = useActionState(
    acceptInvitation,
    initialInvitationActionState,
  );
  const [declineState, declineAction, isDeclinePending] = useActionState(
    declineInvitation,
    initialInvitationActionState,
  );
  const MethodIcon = methodIconMap[invitation.method];

  useEffect(() => {
    if (acceptState.success || declineState.success) {
      router.refresh();
    }
  }, [acceptState.success, declineState.success, router]);

  return (
    <article className="rounded-[1.65rem] border border-border bg-panel-muted px-5 py-5 shadow-[0_12px_24px_rgba(15,23,42,0.04)] dark:shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[1.2rem] border border-border bg-panel text-sm font-semibold text-foreground">
            {profile.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt={profile.fullName}
                width={48}
                height={48}
                unoptimized
                className="h-full w-full object-cover"
              />
            ) : (
              profile.fullName
                .split(" ")
                .map((part) => part.trim().charAt(0))
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase()
            )}
          </div>

          <div className="min-w-0">
            <p className="text-base font-semibold text-foreground">{profile.fullName}</p>
            <p className="mt-1 text-sm text-muted">
              Invited to {invitation.spaceName} as {formatRoleLabel(invitation.role)}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-panel px-2.5 py-1 text-xs font-medium text-foreground">
                <MethodIcon className="h-3.5 w-3.5" />
                {invitation.method}
              </span>
              <span className="inline-flex rounded-full border border-border bg-panel px-2.5 py-1 text-xs font-medium text-foreground">
                {formatRoleLabel(invitation.role)}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-[1.2rem] border border-border bg-panel px-3 py-2 text-right text-xs text-muted">
          <p>Invited by {invitation.invitedByName}</p>
          <p className="mt-1">Expires {invitation.expiresAt}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-[1.2rem] border border-border bg-panel px-4 py-3 text-sm text-muted">
          <p className="flex items-center gap-2 font-medium text-foreground">
            <UserPlus2 className="h-4 w-4 text-accent" />
            Access scope
          </p>
          <p className="mt-2 leading-6">
            {invitation.workOrderTitles.length > 0
              ? invitation.workOrderTitles.join(", ")
              : "Space team access only"}
          </p>
        </div>
        <div className="rounded-[1.2rem] border border-border bg-panel px-4 py-3 text-sm text-muted">
          <p className="font-medium text-foreground">Invite details</p>
          <p className="mt-2 leading-6">
            Created {invitation.createdAt}
          </p>
          {invitation.message ? (
            <p className="mt-2 leading-6">
              {invitation.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <form action={acceptAction}>
          <input type="hidden" name="inviteId" value={invitation.id} />
          <Button
            type="submit"
            disabled={isAcceptPending || isDeclinePending}
            className="h-11 rounded-2xl bg-accent px-5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(31,95,255,0.24)] hover:brightness-110 dark:shadow-none"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {isAcceptPending ? "Accepting..." : "Accept Invitation"}
          </Button>
        </form>
        <form action={declineAction}>
          <input type="hidden" name="inviteId" value={invitation.id} />
          <Button
            type="submit"
            variant="secondary"
            disabled={isAcceptPending || isDeclinePending}
            className="h-11 rounded-2xl border-border bg-panel px-5 text-sm font-medium text-foreground hover:bg-panel-muted"
          >
            <XCircle className="mr-2 h-4 w-4" />
            {isDeclinePending ? "Declining..." : "Decline"}
          </Button>
        </form>
      </div>

      <div className="mt-3 grid gap-2">
        <FormMessage
          message={acceptState.error ?? acceptState.success}
          tone={acceptState.error ? "error" : "info"}
        />
        <FormMessage
          message={declineState.error ?? declineState.success}
          tone={declineState.error ? "error" : "info"}
        />
      </div>
    </article>
  );
}
