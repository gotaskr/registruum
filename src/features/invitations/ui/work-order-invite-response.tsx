"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
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
  autoAccept: boolean;
  isWorkOrderInvite: boolean;
}>;

export function WorkOrderInviteResponse({
  token,
  isAuthenticated,
  autoAccept,
  isWorkOrderInvite,
}: WorkOrderInviteResponseProps) {
  const [acceptState, acceptAction, acceptPending] = useActionState(
    acceptWorkOrderInviteLink,
    initialInvitationActionState,
  );
  const [declineState, declineAction, declinePending] = useActionState(
    declineWorkOrderInviteLink,
    initialInvitationActionState,
  );
  const autoAcceptFormRef = useRef<HTMLFormElement | null>(null);
  const next = `/invite/${token}?intent=accept`;

  useEffect(() => {
    if (isAuthenticated && autoAccept) {
      autoAcceptFormRef.current?.requestSubmit();
    }
  }, [autoAccept, isAuthenticated]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-panel-muted px-4 py-4 text-sm text-muted">
        {isWorkOrderInvite
          ? "Accepting this invite will add you to the work order with the default assigned role. If you are not signed in, you will continue through authentication first."
          : "Accepting this invite will add you to the space team with the assigned team role. If you are not signed in, you will continue through authentication first."}
      </div>
      <div className="flex flex-wrap gap-3">
        {isAuthenticated ? (
          <form ref={autoAcceptFormRef} action={acceptAction}>
            <input type="hidden" name="token" value={token} />
            <Button type="submit" disabled={acceptPending}>
              {acceptPending ? "Accepting..." : "Accept"}
            </Button>
          </form>
        ) : (
          <Link href={`/sign-in?next=${encodeURIComponent(next)}`}>
            <Button>Accept</Button>
          </Link>
        )}
        <form action={declineAction}>
          <input type="hidden" name="token" value={token} />
          <Button type="submit" variant="secondary" disabled={declinePending}>
            {declinePending ? "Declining..." : "Decline"}
          </Button>
        </form>
      </div>
      <FormMessage
        message={acceptState.error ?? declineState.error ?? declineState.success}
        tone={acceptState.error || declineState.error ? "error" : "info"}
      />
    </div>
  );
}
