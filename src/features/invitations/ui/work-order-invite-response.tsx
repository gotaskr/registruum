"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/features/auth/ui/form-message";
import {
  acceptWorkOrderInviteLink,
  declineWorkOrderInviteLink,
} from "@/features/invitations/actions/work-order-invite.actions";
import { initialInvitationActionState } from "@/features/settings/types/invitation-action-state";

type WorkOrderInviteResponseProps = Readonly<{
  token: string;
  isAuthenticated: boolean;
  isOwnInvite: boolean;
}>;

export function WorkOrderInviteResponse({
  token,
  isAuthenticated,
  isOwnInvite,
}: WorkOrderInviteResponseProps) {
  const router = useRouter();
  const [acceptState, acceptAction, acceptPending] = useActionState(
    acceptWorkOrderInviteLink,
    initialInvitationActionState,
  );
  const [declineState, declineAction, declinePending] = useActionState(
    declineWorkOrderInviteLink,
    initialInvitationActionState,
  );
  /** After sign-in, land on this page so the user explicitly taps Accept (no auto-submit). */
  const acceptNext = `/invite/${token}`;
  const inviteReturnUrl = `/invite/${token}`;

  useEffect(() => {
    if (declineState.success) {
      router.replace("/?notice=invite-declined");
    }
  }, [declineState.success, router]);

  if (isOwnInvite) {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
          You can&apos;t accept an invitation you created. Share this link with the person you
          invited.
        </div>
        <form action={declineAction}>
          <input type="hidden" name="token" value={token} />
          <Button
            type="submit"
            variant="secondary"
            disabled={declinePending}
            className="h-12 w-full rounded-2xl text-sm"
          >
            {declinePending ? "Revoking…" : "Revoke invitation"}
          </Button>
        </form>
        <FormMessage
          message={declineState.error ?? declineState.success}
          tone={declineState.error ? "error" : "info"}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {isAuthenticated ? (
          <form action={acceptAction} className="contents">
            <input type="hidden" name="token" value={token} />
            <Button
              type="submit"
              disabled={acceptPending}
              className="h-12 w-full rounded-2xl text-sm"
            >
              {acceptPending ? "Accepting…" : "Accept"}
            </Button>
          </form>
        ) : (
          <Link href={`/sign-in?next=${encodeURIComponent(acceptNext)}`} className="contents">
            <Button className="h-12 w-full rounded-2xl text-sm">Accept</Button>
          </Link>
        )}
        {isAuthenticated ? (
          <form action={declineAction} className="contents">
            <input type="hidden" name="token" value={token} />
            <Button
              type="submit"
              variant="secondary"
              disabled={declinePending}
              className="h-12 w-full rounded-2xl text-sm"
            >
              {declinePending ? "Declining…" : "Decline"}
            </Button>
          </form>
        ) : (
          <Link
            href={`/sign-in?next=${encodeURIComponent(inviteReturnUrl)}`}
            className="contents"
          >
            <Button variant="secondary" className="h-12 w-full rounded-2xl text-sm">
              Decline
            </Button>
          </Link>
        )}
      </div>
      <FormMessage
        message={acceptState.error ?? declineState.error ?? declineState.success}
        tone={acceptState.error || declineState.error ? "error" : "info"}
      />
    </div>
  );
}
