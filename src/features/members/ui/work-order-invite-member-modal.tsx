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
import { getDefaultWorkOrderInviteRole } from "@/features/permissions/lib/roles";
import { cn, formatRoleLabel } from "@/lib/utils";

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
  const defaultRole = getDefaultWorkOrderInviteRole();
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

  const tabItems = [
    { id: "link" as const, label: "Invite via Link", icon: Link2 },
    { id: "code" as const, label: "Add by User Tag", icon: UserRoundPlus },
  ];

  const primaryMobileClass =
    "h-12 w-full touch-manipulation rounded-2xl text-[15px] font-semibold shadow-sm sm:h-10 sm:w-auto sm:rounded-xl sm:text-sm sm:font-medium sm:shadow-none lg:min-w-[11rem]";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invite Member"
      description="Bring someone into this work order directly, without sending them through a separate members area."
      bottomSheetOnNarrow
      panelClassName="max-w-none lg:max-w-2xl"
    >
      <div className="flex min-h-0 flex-1 flex-col lg:min-h-0">
        <div className="shrink-0 px-4 pb-3 pt-1 lg:px-5 lg:pb-4 lg:pt-2">
          <div
            className="grid grid-cols-2 gap-1 rounded-2xl border border-[#2f5fd4]/20 bg-[#eef3ff] p-1 dark:border-[#3d6fd9]/35 dark:bg-slate-900/90 sm:inline-flex sm:w-auto sm:gap-1"
            role="tablist"
            aria-label="Invitation method"
          >
            {tabItems.map((tab) => {
              const Icon = tab.icon;
              const selected = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "inline-flex min-h-[2.75rem] items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-center text-[11px] font-semibold leading-tight transition-all sm:min-h-0 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm",
                    selected
                      ? "bg-[#2f5fd4] text-white shadow-[0_2px_8px_rgba(47,95,212,0.35)] dark:bg-[#3d6fd9] dark:shadow-[0_2px_12px_rgba(61,111,217,0.45)]"
                      : "bg-white/95 text-slate-900 hover:bg-white dark:bg-slate-800/80 dark:text-slate-100 dark:hover:bg-slate-800",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                  <span className="sm:hidden">{tab.id === "link" ? "Link" : "User tag"}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === "link" ? (
          <form
            action={emailFormAction}
            className="flex min-h-0 flex-1 flex-col max-lg:min-h-0"
          >
            <input type="hidden" name="spaceId" value={spaceId} />
            <input type="hidden" name="workOrderId" value={workOrderId} />

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4 lg:px-5">
              <div className="rounded-2xl border border-[#2f5fd4]/15 bg-[#eef3ff] px-4 py-3.5 text-[13px] leading-relaxed text-slate-800 dark:border-[#3d6fd9]/25 dark:bg-slate-800 dark:text-slate-100 sm:text-sm">
                Anyone who joins through this invite link will be added to the work order as a{" "}
                <span className="font-semibold text-[#1a3d8f] dark:text-[#93c5fd]">
                  {formatRoleLabel(defaultRole).toLowerCase()}
                </span>
                . A lead or manager can change their role later.
              </div>

              {emailState.inviteLink ? (
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200 sm:text-sm sm:normal-case sm:tracking-normal sm:font-medium">
                    Invite link
                  </span>
                  <input
                    readOnly
                    value={resolvedInviteLink}
                    className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-[13px] text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-[#2f5fd4]/40 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 sm:rounded-xl sm:py-2 sm:text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-11 flex-1 touch-manipulation rounded-xl border-slate-300 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 sm:h-10 sm:flex-none sm:rounded-lg"
                      onClick={handleCopy}
                    >
                      <Copy className="mr-2 h-4 w-4 shrink-0" />
                      {copied ? "Copied" : "Copy"}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-11 flex-1 touch-manipulation rounded-xl border-slate-300 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 sm:h-10 sm:flex-none sm:rounded-lg"
                      onClick={handleOpenLink}
                    >
                      Open
                    </Button>
                  </div>
                </div>
              ) : null}

              <FormMessage
                message={emailState.error ?? emailState.success}
                tone={emailState.error ? "error" : "info"}
                className="text-xs shadow-none sm:text-sm"
              />
            </div>

            <div className="flex shrink-0 justify-stretch border-t border-border bg-panel/95 px-4 pt-3 backdrop-blur-md supports-[backdrop-filter]:bg-panel/85 max-lg:pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] lg:justify-end lg:border-0 lg:bg-transparent lg:px-5 lg:pb-4 lg:pt-0 lg:backdrop-blur-0">
              <Button
                type="submit"
                variant="brand"
                disabled={emailPending}
                className={primaryMobileClass}
              >
                {emailPending
                  ? "Generating link…"
                  : emailState.inviteLink
                    ? "Generate new link"
                    : "Generate invite link"}
              </Button>
            </div>
          </form>
        ) : null}

        {activeTab === "code" ? (
          <div className="flex min-h-0 flex-1 flex-col space-y-4 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] lg:space-y-5 lg:px-5 lg:pb-5">
            <form action={previewFormAction} className="space-y-4">
              <input type="hidden" name="spaceId" value={spaceId} />
              <input type="hidden" name="workOrderId" value={workOrderId} />
              <label className="block space-y-2">
                <span className="text-sm font-medium text-foreground">User tag</span>
                <input
                  name="userCode"
                  type="text"
                  value={userCode}
                  onChange={(event) => setUserCode(event.target.value.toUpperCase())}
                  placeholder="#A1B2C3"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-[#2f5fd4]/45 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 sm:min-h-11 sm:rounded-xl sm:py-2.5 sm:text-sm"
                />
              </label>
              <div className="flex flex-col lg:items-end">
                <Button
                  type="submit"
                  variant="brand"
                  disabled={previewPending}
                  className={primaryMobileClass}
                >
                  {previewPending ? "Checking…" : "Preview user"}
                </Button>
              </div>
            </form>

            <FormMessage message={previewState.error} className="text-xs shadow-none sm:text-sm" />

            {previewState.preview ? (
              <div className="space-y-4 rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 py-4 dark:border-slate-600 dark:bg-slate-900/80 sm:rounded-2xl sm:px-4 sm:py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-400 sm:text-xs sm:tracking-[0.2em]">
                      Matched user
                    </p>
                    <h3 className="mt-1.5 text-base font-semibold text-slate-900 dark:text-slate-50 sm:mt-2 sm:text-lg">
                      {previewState.preview.name}
                    </h3>
                    <p className="mt-1 truncate text-sm text-slate-700 dark:text-slate-300 sm:whitespace-normal">
                      {previewState.preview.email}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 sm:px-3">
                      {previewState.preview.memberCode}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 sm:px-3">
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {previewState.preview.verificationState === "verified"
                        ? "Verified"
                        : "Unverified"}
                    </span>
                  </div>
                </div>

                <form action={addFormAction} className="space-y-4 border-t border-border/80 pt-4 dark:border-border">
                  <input type="hidden" name="spaceId" value={spaceId} />
                  <input type="hidden" name="workOrderId" value={workOrderId} />
                  <input type="hidden" name="userCode" value={userCode} />

                  <div className="rounded-xl border border-[#2f5fd4]/15 bg-[#eef3ff] px-3 py-3 text-[13px] leading-relaxed text-slate-800 dark:border-[#3d6fd9]/25 dark:bg-slate-800 dark:text-slate-100 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                    Adding by user tag assigns the default role:{" "}
                    <span className="font-semibold text-[#1a3d8f] dark:text-[#93c5fd]">
                      {formatRoleLabel(defaultRole)}
                    </span>
                  </div>

                  <FormMessage
                    message={addState.error ?? addState.success}
                    tone={addState.error ? "error" : "info"}
                    className="text-xs shadow-none sm:text-sm"
                  />

                  <div className="flex flex-col lg:items-end">
                    <Button
                      type="submit"
                      variant="brand"
                      disabled={addPending}
                      className={primaryMobileClass}
                    >
                      {addPending ? "Adding…" : "Add to work order"}
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
