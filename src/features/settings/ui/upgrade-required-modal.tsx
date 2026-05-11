"use client";

import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import type { UpgradePrompt } from "@/features/settings/types/upgrade-prompt";

type UpgradeRequiredModalProps = Readonly<{
  prompt: UpgradePrompt | null;
  onClose: () => void;
}>;

export function UpgradeRequiredModal({
  prompt,
  onClose,
}: UpgradeRequiredModalProps) {
  const isMemberLimitPrompt =
    (prompt?.title ?? "").toLowerCase().includes("member") ||
    (prompt?.reason ?? "").toLowerCase().includes("including the account owner/admin");

  return (
    <Modal
      open={Boolean(prompt)}
      onClose={onClose}
      title={prompt?.title ?? "Upgrade required"}
      description="This action is outside your current plan."
      panelClassName="max-w-lg"
    >
      <div className="space-y-4 px-5 py-5">
        <div className="rounded-[1.4rem] border border-border bg-panel-muted px-4 py-4">
          <p className="text-sm leading-6 text-foreground">{prompt?.reason}</p>
          <p className="mt-2 text-sm leading-6 text-muted">{prompt?.suggestedAction}</p>
          {isMemberLimitPrompt ? (
            <p className="mt-2 text-xs leading-5 text-muted">
              Note: user caps include the account owner/admin.
            </p>
          ) : null}
        </div>

        <div className="rounded-[1.2rem] border border-accent/25 bg-accent-soft/50 px-4 py-3 text-sm text-foreground">
          <p className="inline-flex items-center gap-2 font-medium">
            <Sparkles className="h-4 w-4 text-accent" />
            Upgrading unlocks higher limits immediately.
          </p>
        </div>

        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-panel px-5 text-sm font-medium text-foreground transition-colors hover:bg-panel-muted"
          >
            Not now
          </button>
          <Link
            href="/settings?section=subscription"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(31,95,255,0.24)] dark:shadow-none"
          >
            Upgrade plan
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </Modal>
  );
}
