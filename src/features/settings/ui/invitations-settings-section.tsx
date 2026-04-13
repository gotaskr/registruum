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
        <div className="rounded-2xl border border-dashed border-border bg-panel-muted px-4 py-8 text-center sm:rounded-[1.6rem] sm:px-5 sm:py-10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-panel text-accent shadow-sm dark:shadow-none sm:h-14 sm:w-14 sm:rounded-2xl sm:shadow-[0_12px_24px_rgba(15,23,42,0.04)]">
            <Inbox className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <p className="mt-3 text-sm font-semibold leading-snug text-foreground sm:mt-4 sm:text-base">
            No invitations right now
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted sm:text-sm sm:leading-6">
            New space and work order invitations will appear here as soon as they arrive.
          </p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
            <div className="rounded-xl border border-border bg-panel-muted px-3 py-3 sm:rounded-[1.4rem] sm:px-4 sm:py-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted sm:text-[11px] sm:tracking-[0.22em]">
                Pending
              </p>
              <p className="mt-2 text-xl font-semibold text-foreground sm:mt-3 sm:text-2xl">
                {invitations.length}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-panel-muted px-3 py-3 sm:rounded-[1.4rem] sm:px-4 sm:py-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted sm:text-[11px] sm:tracking-[0.22em]">
                Spaces
              </p>
              <p className="mt-2 text-sm font-medium leading-snug text-foreground sm:mt-3">
                {[...new Set(invitations.map((invitation) => invitation.spaceName))].length} active targets
              </p>
            </div>
            <div className="rounded-xl border border-border bg-panel-muted px-3 py-3 sm:rounded-[1.4rem] sm:px-4 sm:py-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted sm:text-[11px] sm:tracking-[0.22em]">
                Roles
              </p>
              <p className="mt-2 text-sm font-medium leading-snug text-foreground sm:mt-3">
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
    <article
      id={`invite-${invitation.id}`}
      className="rounded-2xl border border-border bg-panel-muted px-4 py-4 shadow-sm sm:rounded-[1.65rem] sm:px-5 sm:py-5 sm:shadow-[0_12px_24px_rgba(15,23,42,0.04)] dark:shadow-none dark:sm:shadow-none"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-panel text-xs font-semibold text-foreground sm:h-14 sm:w-14 sm:rounded-[1.2rem] sm:text-sm">
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

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-snug text-foreground sm:text-base">
              {profile.fullName}
            </p>
            <p className="mt-1 break-words text-xs leading-relaxed text-muted sm:text-sm sm:leading-normal">
              Invited to{" "}
              <span className="font-medium text-foreground">{invitation.spaceName}</span> as{" "}
              {formatRoleLabel(invitation.role)}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2 sm:mt-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-panel px-2.5 py-1 text-[11px] font-medium text-foreground sm:text-xs">
                <MethodIcon className="h-3.5 w-3.5 shrink-0" />
                {invitation.method}
              </span>
              <span className="inline-flex rounded-full border border-border bg-panel px-2.5 py-1 text-[11px] font-medium text-foreground sm:text-xs">
                {formatRoleLabel(invitation.role)}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full shrink-0 rounded-xl border border-border bg-panel px-3 py-2.5 text-left text-[11px] leading-relaxed text-muted sm:w-auto sm:rounded-[1.2rem] sm:py-2 sm:text-right sm:text-xs">
          <p className="break-words">
            <span className="text-muted">Invited by </span>
            <span className="font-medium text-foreground">{invitation.invitedByName}</span>
          </p>
          <p className="mt-1.5 sm:mt-1">
            <span className="text-muted">Expires </span>
            <span className="font-medium text-foreground">{invitation.expiresAt}</span>
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:mt-4 sm:gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-panel px-3 py-2.5 text-xs text-muted sm:rounded-[1.2rem] sm:px-4 sm:py-3 sm:text-sm">
          <p className="flex items-center gap-2 font-medium text-foreground">
            <UserPlus2 className="h-4 w-4 shrink-0 text-accent" />
            Access scope
          </p>
          <p className="mt-2 break-words leading-relaxed sm:leading-6">
            {invitation.workOrderTitles.length > 0
              ? invitation.workOrderTitles.join(", ")
              : "Space team access only"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-panel px-3 py-2.5 text-xs text-muted sm:rounded-[1.2rem] sm:px-4 sm:py-3 sm:text-sm">
          <p className="font-medium text-foreground">Invite details</p>
          <p className="mt-2 break-words leading-relaxed sm:leading-6">
            Created {invitation.createdAt}
          </p>
          {invitation.message ? (
            <p className="mt-2 break-words leading-relaxed sm:leading-6">
              {invitation.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:mt-5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <form action={acceptAction} className="w-full sm:w-auto">
          <input type="hidden" name="inviteId" value={invitation.id} />
          <Button
            type="submit"
            disabled={isAcceptPending || isDeclinePending}
            className="h-12 w-full touch-manipulation rounded-xl bg-accent px-5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(31,95,255,0.24)] hover:brightness-110 dark:shadow-none sm:h-11 sm:w-auto sm:rounded-2xl"
          >
            <CheckCircle2 className="mr-2 h-4 w-4 shrink-0" />
            {isAcceptPending ? "Accepting..." : "Accept Invitation"}
          </Button>
        </form>
        <form action={declineAction} className="w-full sm:w-auto">
          <input type="hidden" name="inviteId" value={invitation.id} />
          <Button
            type="submit"
            variant="secondary"
            disabled={isAcceptPending || isDeclinePending}
            className="h-12 w-full touch-manipulation rounded-xl border-border bg-panel px-5 text-sm font-medium text-foreground hover:bg-panel-muted sm:h-11 sm:w-auto sm:rounded-2xl"
          >
            <XCircle className="mr-2 h-4 w-4 shrink-0" />
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
