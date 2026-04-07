"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CheckCircle2, Copy, MoreHorizontal, PencilLine } from "lucide-react";
import { SettingsCard } from "@/features/settings/ui/settings-card";
import { ProfileIdentityEditModal } from "@/features/settings/ui/profile-identity-edit-modal";
import { getInitials } from "@/lib/utils";
import type { Profile } from "@/types/profile";

type ProfileIdentityCardProps = Readonly<{
  profile: Profile;
}>;

export function ProfileIdentityCard({
  profile,
}: ProfileIdentityCardProps) {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const isVerified = Boolean(profile.emailVerifiedAt);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [menuOpen]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(profile.userTag);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <SettingsCard
      id="profile"
      label="Identity"
      title="System identity record"
      description="This identity is used across work orders, logs, and audit-ready records."
      highlighted
    >
      <div className="grid gap-4">
        <div className="grid gap-5 md:grid-cols-[5.5rem_minmax(0,1fr)_auto]">
          <div className="flex h-[5.5rem] w-[5.5rem] items-center justify-center overflow-hidden rounded-[1.6rem] border border-border bg-panel-muted text-xl font-semibold text-foreground shadow-[0_12px_24px_rgba(15,23,42,0.05)] dark:shadow-none">
            {profile.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt={profile.fullName}
                width={80}
                height={80}
                unoptimized
                className="h-full w-full object-cover"
              />
            ) : (
              getInitials(profile.fullName)
            )}
          </div>
          <div className="min-w-0 space-y-3">
            <div className="space-y-1">
              <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                {profile.fullName}
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
                <span className="truncate">{profile.email}</span>
                <span className="text-border-strong">/</span>
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-panel px-2.5 py-1 text-[11px] font-medium text-muted">
                  <CheckCircle2 className="h-3 w-3" />
                  {isVerified ? "Verified" : "Pending"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-[#111827] px-3 py-1.5 font-mono text-xs font-semibold tracking-[0.14em] text-white">
                {profile.userTag}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-panel text-muted transition-colors hover:bg-panel-muted hover:text-foreground"
                aria-label="Copy user tag"
                title="Copy user tag"
              >
                <Copy className="h-4 w-4" />
              </button>
              <span
                className={[
                  "text-xs text-muted transition-opacity duration-150",
                  copied ? "opacity-100" : "opacity-0",
                ].join(" ")}
                aria-live="polite"
              >
                Copied
              </span>
            </div>
          </div>
          <div className="relative justify-self-start md:justify-self-end" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-panel text-muted transition-colors hover:bg-panel-muted hover:text-foreground"
              aria-label="Open identity actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {menuOpen ? (
              <div className="absolute right-0 top-12 z-10 min-w-36 rounded-[1.2rem] border border-border bg-panel p-1.5 shadow-[0_16px_34px_rgba(15,23,42,0.08)] dark:shadow-none">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setEditOpen(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-panel-muted"
                >
                  <PencilLine className="h-4 w-4" />
                  Edit
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-[1.35rem] border border-border bg-panel-muted px-4 py-4">
          <p className="text-sm leading-6 text-muted">
            This tag is used for member invites and internal identification.
          </p>
        </div>
      </div>

      <ProfileIdentityEditModal
        key={`${profile.updatedAt}-${profile.avatarPath ?? "no-avatar"}-${editOpen ? "open" : "closed"}`}
        open={editOpen}
        profile={profile}
        onClose={() => setEditOpen(false)}
      />
    </SettingsCard>
  );
}
