import { useActionState, useEffect } from "react";
import Image from "next/image";
import { Inbox, Mail, Ticket } from "lucide-react";
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
      description="See invitations that are currently waiting for your response."
    >
      {invitations.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-panel-muted px-4 py-8 text-center">
          <p className="text-sm font-medium text-foreground">No invitations right now</p>
          <p className="mt-1 text-sm text-muted">
            New work order invitations will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
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
    <article className="rounded-lg border border-border bg-panel-muted px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-panel text-sm font-semibold text-foreground">
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

        <div className="text-right text-xs text-muted">
          <p>Invited by {invitation.invitedByName}</p>
          <p className="mt-1">Expires {invitation.expiresAt}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-muted">
        <p>
          <span className="font-medium text-foreground">Work orders:</span>{" "}
          {invitation.workOrderTitles.length > 0
            ? invitation.workOrderTitles.join(", ")
            : "No active work orders"}
        </p>
        <p>
          <span className="font-medium text-foreground">Created:</span> {invitation.createdAt}
        </p>
        {invitation.message ? (
          <p>
            <span className="font-medium text-foreground">Message:</span> {invitation.message}
          </p>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <form action={acceptAction}>
          <input type="hidden" name="inviteId" value={invitation.id} />
          <Button type="submit" disabled={isAcceptPending || isDeclinePending}>
            {isAcceptPending ? "Accepting..." : "Accept"}
          </Button>
        </form>
        <form action={declineAction}>
          <input type="hidden" name="inviteId" value={invitation.id} />
          <Button
            type="submit"
            variant="secondary"
            disabled={isAcceptPending || isDeclinePending}
          >
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
