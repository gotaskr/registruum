"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Copy, Link2, ShieldCheck, UserRoundPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { FormMessage } from "@/features/auth/ui/form-message";
import {
  addWorkOrderMemberByCode,
  createWorkOrderInvite,
  previewWorkOrderMemberByCode,
} from "@/features/members/actions/member.actions";
import {
  initialWorkOrderMemberCodePreviewState,
  initialWorkOrderMemberActionState,
} from "@/features/members/types/work-order-member-action-state";
import { formatRoleLabel } from "@/lib/utils";

type InviteTab = "link" | "code";

type WorkOrderInviteMemberModalProps = Readonly<{
  open: boolean;
  onClose: () => void;
  spaceId: string;
  workOrderId: string;
}>;

export function WorkOrderInviteMemberModal({
  open,
  onClose,
  spaceId,
  workOrderId,
}: WorkOrderInviteMemberModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<InviteTab>("link");
  const [userCode, setUserCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [emailState, emailFormAction, emailPending] = useActionState(
    createWorkOrderInvite,
    initialWorkOrderMemberActionState,
  );
  const [previewState, previewFormAction, previewPending] = useActionState(
    previewWorkOrderMemberByCode,
    initialWorkOrderMemberCodePreviewState,
  );
  const [addState, addFormAction, addPending] = useActionState(
    addWorkOrderMemberByCode,
    initialWorkOrderMemberActionState,
  );
  const resolvedInviteLink = useMemo(() => {
    if (!emailState.inviteLink) {
      return "";
    }

    if (
      emailState.inviteLink.startsWith("http://") ||
      emailState.inviteLink.startsWith("https://")
    ) {
      return emailState.inviteLink;
    }

    if (typeof window === "undefined") {
      return emailState.inviteLink;
    }

    return new URL(emailState.inviteLink, window.location.origin).toString();
  }, [emailState.inviteLink]);

  useEffect(() => {
    if (!emailState.success && !addState.success) {
      return;
    }

    if (!emailState.inviteLink) {
      onClose();
      router.refresh();
    }
  }, [addState.success, emailState.inviteLink, emailState.success, onClose, router]);

  const handleCopy = async () => {
    if (!resolvedInviteLink) {
      return;
    }

    await navigator.clipboard.writeText(resolvedInviteLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const handleOpenLink = () => {
    if (!resolvedInviteLink) {
      return;
    }

    window.open(resolvedInviteLink, "_blank", "noopener,noreferrer");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invite Member"
      description="Bring someone into this work order directly, without sending them through a separate members area."
      panelClassName="max-w-2xl"
    >
      <div className="space-y-5 px-5 py-4">
        <div className="inline-flex rounded-2xl border border-border bg-panel-muted p-1">
          {([
            { id: "link", label: "Invite via Link", icon: Link2 },
            { id: "code", label: "Add by Member Code", icon: UserRoundPlus },
          ] as const).map((tab) => {
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={[
                  "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-slate-950 text-white"
                    : "text-muted hover:text-foreground",
                ].join(" ")}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "link" ? (
          <form action={emailFormAction} className="space-y-4">
            <input type="hidden" name="spaceId" value={spaceId} />
            <input type="hidden" name="workOrderId" value={workOrderId} />

            <div className="rounded-2xl border border-border bg-panel-muted px-4 py-4 text-sm text-muted">
              Anyone who joins through this invite link will be added to the work order as a
              member. An admin can change their role later.
            </div>

            {emailState.inviteLink ? (
              <div className="space-y-2">
                <span className="text-sm font-medium text-foreground">Invite Link</span>
                <div className="flex gap-3">
                  <input
                    readOnly
                    value={resolvedInviteLink}
                    className="h-11 flex-1 rounded-2xl border border-border bg-panel px-3 text-sm text-foreground outline-none"
                  />
                  <Button type="button" variant="secondary" onClick={handleCopy}>
                    <Copy className="mr-2 h-4 w-4" />
                    {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button type="button" variant="secondary" onClick={handleOpenLink}>
                    Open Link
                  </Button>
                </div>
              </div>
            ) : null}

            <FormMessage
              message={emailState.error ?? emailState.success}
              tone={emailState.error ? "error" : "info"}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={emailPending}>
                {emailPending
                  ? "Generating Link..."
                  : emailState.inviteLink
                    ? "Generate New Link"
                    : "Generate Invite Link"}
              </Button>
            </div>
          </form>
        ) : null}

        {activeTab === "code" ? (
          <div className="space-y-4">
            <form action={previewFormAction} className="space-y-4">
              <input type="hidden" name="spaceId" value={spaceId} />
              <input type="hidden" name="workOrderId" value={workOrderId} />
              <label className="block space-y-2">
                <span className="text-sm font-medium text-foreground">Member Code</span>
                <input
                  name="userCode"
                  type="text"
                  value={userCode}
                  onChange={(event) => setUserCode(event.target.value.toUpperCase())}
                  placeholder="#A1B2C3"
                  className="h-11 w-full rounded-2xl border border-border bg-panel px-3 text-sm text-foreground outline-none"
                />
              </label>
              <div className="flex justify-end">
                <Button type="submit" disabled={previewPending}>
                  {previewPending ? "Checking..." : "Preview User"}
                </Button>
              </div>
            </form>

            <FormMessage message={previewState.error} />

            {previewState.preview ? (
              <div className="space-y-4 rounded-2xl border border-border bg-panel-muted px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                      Matched User
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-foreground">
                      {previewState.preview.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted">{previewState.preview.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex rounded-full border border-border bg-panel px-3 py-1 text-xs font-semibold text-foreground">
                      {previewState.preview.memberCode}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-panel px-3 py-1 text-xs text-muted">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {previewState.preview.verificationState === "verified"
                        ? "Verified"
                        : "Unverified"}
                    </span>
                  </div>
                </div>

                <form action={addFormAction} className="space-y-4">
                  <input type="hidden" name="spaceId" value={spaceId} />
                  <input type="hidden" name="workOrderId" value={workOrderId} />
                  <input type="hidden" name="userCode" value={userCode} />

                  <div className="rounded-2xl border border-border bg-panel px-4 py-4 text-sm text-muted">
                    Adding by member code always assigns the default role:{" "}
                    <span className="font-medium text-foreground">{formatRoleLabel("member")}</span>
                  </div>

                  <FormMessage
                    message={addState.error ?? addState.success}
                    tone={addState.error ? "error" : "info"}
                  />

                  <div className="flex justify-end">
                    <Button type="submit" disabled={addPending}>
                      {addPending ? "Adding..." : "Add to Work Order"}
                    </Button>
                  </div>
                </form>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
