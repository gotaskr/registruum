"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ChevronRight,
  ChevronsUpDown,
  CreditCard,
  Inbox,
  LogOut,
  Search,
  Settings,
} from "lucide-react";
import { signOut } from "@/features/auth/actions/auth.actions";
import { SpaceAvatar } from "@/features/spaces/ui/space-avatar";
import {
  getDashboardHref,
  getSpaceEntryHref,
  getSettingsHref,
} from "@/lib/route-utils";
import { getInitials } from "@/lib/utils";
import type { Profile } from "@/types/profile";
import type { Space } from "@/types/space";

type RegistruumTopNavProps = Readonly<{
  profile: Profile;
  spaces: Space[];
  space?: Space | null;
}>;

export function RegistruumTopNav({
  profile,
  spaces,
  space = null,
}: RegistruumTopNavProps) {
  const [isSpaceMenuOpen, setIsSpaceMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const spaceMenuRef = useRef<HTMLDivElement | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const activeSpaceLabel = space?.name ?? "Spaces";

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;

      if (!spaceMenuRef.current?.contains(target)) {
        setIsSpaceMenuOpen(false);
      }

      if (!profileMenuRef.current?.contains(target)) {
        setIsProfileMenuOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-panel/92 backdrop-blur">
      <div className="flex min-h-[4.5rem] items-center gap-4 px-5 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link href={getDashboardHref()} className="shrink-0">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2f5fd4] text-base font-semibold text-white shadow-[0_10px_24px_rgba(47,95,212,0.22)]">
              R
            </span>
          </Link>
          <div className="relative min-w-0" ref={spaceMenuRef}>
            <div className="flex min-w-0 items-center gap-2 text-sm font-semibold uppercase tracking-[0.28em] text-muted">
              <Link href={getDashboardHref()} className="hover:text-foreground">
                Registruum
              </Link>
              <span>/</span>
              <button
                type="button"
                onClick={() => setIsSpaceMenuOpen((current) => !current)}
                className="inline-flex min-w-0 items-center gap-2 rounded-xl px-2 py-1 text-[0.95rem] font-semibold normal-case tracking-normal text-foreground"
                aria-haspopup="menu"
                aria-expanded={isSpaceMenuOpen}
                >
                  {space ? (
                    <SpaceAvatar
                      name={space.name}
                      photoUrl={space.photoUrl}
                      className="h-7 w-7 rounded-xl"
                      fallbackClassName="border border-[#dbe4f0]"
                      iconClassName="h-3.5 w-3.5"
                      textClassName="text-[8px]"
                    />
                  ) : null}
                  <span className="truncate">{activeSpaceLabel}</span>
                  <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted" />
                </button>
            </div>

            {isSpaceMenuOpen ? (
              <div className="absolute mt-3 w-[20rem] rounded-[1.6rem] border border-border bg-panel p-2 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                <div className="px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
                    Active Spaces
                  </p>
                </div>
                <div className="space-y-1">
                  {spaces.map((candidate) => (
                    <Link
                      key={candidate.id}
                      href={getSpaceEntryHref(candidate)}
                      className="flex items-center justify-between rounded-2xl px-3 py-3 text-sm transition-colors hover:bg-panel-muted"
                      onClick={() => setIsSpaceMenuOpen(false)}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <SpaceAvatar
                          name={candidate.name}
                          photoUrl={candidate.photoUrl}
                          className="h-10 w-10 rounded-[0.95rem]"
                          fallbackClassName="border border-border"
                          iconClassName="h-4 w-4"
                          textClassName="text-[9px]"
                        />
                        <span className="truncate font-medium text-foreground">
                          {candidate.name}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted" />
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mx-auto hidden w-full max-w-2xl lg:block">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              placeholder="Global search for spaces, work orders, teams, and archive"
              className="h-12 w-full rounded-2xl border border-border bg-panel pl-11 pr-4 text-sm text-foreground outline-none shadow-[0_8px_20px_rgba(15,23,42,0.04)] placeholder:text-muted"
            />
          </label>
        </div>

        <div className="relative ml-auto flex items-center" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen((current) => !current)}
            className="inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-border bg-panel text-sm font-semibold text-foreground shadow-[0_8px_20px_rgba(15,23,42,0.04)]"
            title={profile.fullName}
            aria-haspopup="menu"
            aria-expanded={isProfileMenuOpen}
          >
            {profile.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt={profile.fullName}
                width={44}
                height={44}
                unoptimized
                className="h-full w-full object-cover"
              />
            ) : (
              getInitials(profile.fullName)
            )}
          </button>

          {isProfileMenuOpen ? (
            <div className="absolute right-0 top-full mt-3 w-[18rem] rounded-[1.75rem] border border-border bg-panel p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
              <div className="flex flex-col items-center border-b border-border pb-4">
                <div className="inline-flex h-16 w-16 items-center justify-center overflow-hidden rounded-[1.5rem] border border-border bg-panel-muted text-lg font-semibold text-foreground">
                  {profile.avatarUrl ? (
                    <Image
                      src={profile.avatarUrl}
                      alt={profile.fullName}
                      width={64}
                      height={64}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    getInitials(profile.fullName)
                  )}
                </div>
                <p className="mt-3 text-base font-semibold text-foreground">
                  {profile.fullName}
                </p>
                <p className="mt-1 text-sm text-muted">{profile.email}</p>
              </div>

              <div className="mt-4 space-y-1">
                <Link
                  href={`${getSettingsHref()}?section=subscription`}
                  className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-panel-muted"
                  onClick={() => setIsProfileMenuOpen(false)}
                >
                  <CreditCard className="h-4 w-4 text-muted" />
                  <span>Billing</span>
                </Link>
                <Link
                  href={`${getSettingsHref()}?section=invitations`}
                  className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-panel-muted"
                  onClick={() => setIsProfileMenuOpen(false)}
                >
                  <Inbox className="h-4 w-4 text-muted" />
                  <span>Invitations</span>
                </Link>
                <Link
                  href={`${getSettingsHref()}?section=profile`}
                  className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-panel-muted"
                  onClick={() => setIsProfileMenuOpen(false)}
                >
                  <Settings className="h-4 w-4 text-muted" />
                  <span>Settings</span>
                </Link>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm text-rose-700 transition-colors hover:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </form>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
