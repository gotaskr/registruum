"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronRight,
  ChevronsUpDown,
  CreditCard,
  Inbox,
  LogOut,
  Settings,
} from "lucide-react";
import { signOut } from "@/features/auth/actions/auth.actions";
import { GlobalSearchPopover } from "@/components/layout/global-search-popover";
import { RegistruumLogo } from "@/components/ui/registruum-logo";
import { SETTINGS_BILLING_SECTION_ENABLED } from "@/features/settings/lib/settings-sections";
import { SpaceAvatar } from "@/features/spaces/ui/space-avatar";
import type { SettingsInvitation } from "@/features/settings/types/invitation";
import {
  getDashboardHref,
  getSpaceEntryHref,
  getSettingsHref,
} from "@/lib/route-utils";
import { formatRoleLabel, getInitials } from "@/lib/utils";
import type { Profile } from "@/types/profile";
import type { Space } from "@/types/space";

type RegistruumTopNavProps = Readonly<{
  profile: Profile;
  spaces: Space[];
  space?: Space | null;
}>;

type NotificationPanelState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; invitations: SettingsInvitation[] }
  | { status: "error"; message: string };

async function fetchNotificationSummary(): Promise<SettingsInvitation[]> {
  const response = await fetch("/api/notifications/summary", {
    credentials: "same-origin",
    cache: "no-store",
  });

  if (response.status === 401) {
    throw new Error("Sign in to view notifications.");
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Unable to load notifications.");
  }

  const data = (await response.json()) as { invitations: SettingsInvitation[] };
  return data.invitations ?? [];
}

export function RegistruumTopNav({
  profile,
  spaces,
  space = null,
}: RegistruumTopNavProps) {
  const pathname = usePathname();
  const [isSpaceMenuOpen, setIsSpaceMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const [notificationPanel, setNotificationPanel] =
    useState<NotificationPanelState>({ status: "idle" });
  const [invitationBadgeCount, setInvitationBadgeCount] = useState(0);
  const spaceMenuRef = useRef<HTMLDivElement | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationMenuRef = useRef<HTMLDivElement | null>(null);
  const activeSpaceLabel = space?.name ?? "Spaces";

  const refreshInvitationBadge = useCallback(() => {
    let cancelled = false;
    void (async () => {
      try {
        const invitations = await fetchNotificationSummary();
        if (!cancelled) {
          setInvitationBadgeCount(invitations.length);
        }
      } catch {
        if (!cancelled) {
          setInvitationBadgeCount(0);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return refreshInvitationBadge();
  }, [pathname, refreshInvitationBadge]);

  useEffect(() => {
    if (!isNotificationMenuOpen) {
      setNotificationPanel({ status: "idle" });
      return;
    }

    setNotificationPanel({ status: "loading" });
    let cancelled = false;
    void (async () => {
      try {
        const invitations = await fetchNotificationSummary();
        if (!cancelled) {
          setNotificationPanel({ status: "ready", invitations });
          setInvitationBadgeCount(invitations.length);
        }
      } catch (error) {
        if (!cancelled) {
          setNotificationPanel({
            status: "error",
            message: error instanceof Error ? error.message : "Something went wrong.",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isNotificationMenuOpen]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;

      if (!spaceMenuRef.current?.contains(target)) {
        setIsSpaceMenuOpen(false);
      }

      if (!profileMenuRef.current?.contains(target)) {
        setIsProfileMenuOpen(false);
      }

      if (!notificationMenuRef.current?.contains(target)) {
        setIsNotificationMenuOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-panel/92 backdrop-blur supports-[backdrop-filter]:bg-panel/88">
      <div className="flex min-h-[3.25rem] items-center gap-2 px-4 pt-[max(0.5rem,env(safe-area-inset-top,0px))] pb-2 sm:min-h-[3.5rem] sm:gap-3 sm:px-5 sm:pb-2.5 lg:min-h-[4.5rem] lg:gap-4 lg:px-8 lg:py-0 lg:pt-0">
        <Link
          href={getDashboardHref()}
          className="shrink-0 touch-manipulation"
          aria-label="Registruum home"
        >
          <RegistruumLogo variant="nav" />
        </Link>

        <div className="relative min-w-0 flex-1 lg:max-w-none lg:flex-none" ref={spaceMenuRef}>
          {/* Mobile: one compact row — brand hint + space switcher pill */}
          <div className="flex min-w-0 items-center gap-1 sm:gap-1.5 lg:gap-2">
            <Link
              href={getDashboardHref()}
              className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.2em] text-muted hover:text-foreground sm:text-[10px] sm:tracking-[0.22em] lg:text-sm lg:tracking-[0.28em]"
            >
              Registruum
            </Link>
            <span className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.2em] text-muted sm:text-[10px] sm:tracking-[0.22em] lg:text-sm lg:tracking-[0.28em]">
              /
            </span>
            <button
              type="button"
              onClick={() => setIsSpaceMenuOpen((current) => !current)}
              className="inline-flex min-h-[2.75rem] min-w-0 flex-1 items-center justify-start gap-2 rounded-[1rem] border border-border/80 bg-panel-muted/60 px-2.5 py-1.5 text-left shadow-[0_2px_8px_rgba(15,23,42,0.04)] touch-manipulation sm:min-h-0 sm:flex-initial sm:rounded-xl sm:border-0 sm:bg-transparent sm:px-2 sm:py-1 sm:shadow-none lg:px-2"
              aria-haspopup="menu"
              aria-expanded={isSpaceMenuOpen}
              aria-label={`Space menu, current: ${activeSpaceLabel}`}
            >
              {space ? (
                <SpaceAvatar
                  name={space.name}
                  photoUrl={space.photoUrl}
                  className="h-7 w-7 shrink-0 rounded-lg sm:rounded-xl"
                  fallbackClassName="border border-[#dbe4f0]"
                  iconClassName="h-3.5 w-3.5"
                  textClassName="text-[8px]"
                />
              ) : null}
              <span className="min-w-0 flex-1 truncate text-[0.9375rem] font-semibold normal-case tracking-normal text-foreground sm:flex-initial">
                {activeSpaceLabel}
              </span>
              <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted" aria-hidden />
            </button>
          </div>

          {isSpaceMenuOpen ? (
            <div
              className="absolute left-1/2 z-50 mt-2 w-[min(calc(100vw-2rem),20rem)] max-h-[min(70dvh,24rem)] -translate-x-1/2 overflow-y-auto overscroll-contain rounded-[1.25rem] border border-border bg-panel p-2 shadow-[0_18px_40px_rgba(15,23,42,0.12)] sm:rounded-[1.6rem] lg:left-0 lg:mt-3 lg:w-[20rem] lg:max-h-none lg:translate-x-0 lg:overflow-visible"
            >
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

        <div className="mx-auto hidden min-w-0 lg:flex lg:flex-1 lg:justify-center lg:px-2">
          <GlobalSearchPopover />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-2">
          <div className="relative" ref={notificationMenuRef}>
            <button
              type="button"
              onClick={() => {
                setIsNotificationMenuOpen((current) => !current);
                setIsProfileMenuOpen(false);
              }}
              className="relative inline-flex h-10 w-10 touch-manipulation items-center justify-center rounded-full border border-border bg-panel text-muted shadow-[0_6px_16px_rgba(15,23,42,0.06)] transition-colors hover:bg-panel-muted hover:text-foreground lg:h-11 lg:w-11 lg:rounded-2xl lg:shadow-[0_8px_20px_rgba(15,23,42,0.04)]"
              aria-label="Notifications"
              aria-haspopup="menu"
              aria-expanded={isNotificationMenuOpen}
            >
              <Bell className="h-[1.15rem] w-[1.15rem]" strokeWidth={2.25} aria-hidden />
              {invitationBadgeCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold leading-none text-white">
                  {invitationBadgeCount > 9 ? "9+" : invitationBadgeCount}
                </span>
              ) : null}
            </button>

            {isNotificationMenuOpen ? (
              <div className="absolute right-0 top-full z-50 mt-2 w-[min(calc(100vw-2rem),20rem)] rounded-[1.25rem] border border-border bg-panel p-3 shadow-[0_18px_40px_rgba(15,23,42,0.12)] sm:mt-3 sm:rounded-[1.5rem] sm:p-4">
                <div className="flex items-start justify-between gap-2 border-b border-border pb-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
                    Notifications
                  </p>
                  <Link
                    href={`${getSettingsHref()}?section=notifications`}
                    className="text-xs font-medium text-accent hover:underline"
                    onClick={() => setIsNotificationMenuOpen(false)}
                  >
                    Alert settings
                  </Link>
                </div>

                <div className="max-h-[min(60dvh,18rem)] overflow-y-auto overscroll-contain pt-3">
                  {notificationPanel.status === "loading" ? (
                    <p className="py-6 text-center text-sm text-muted">Loading…</p>
                  ) : null}

                  {notificationPanel.status === "error" ? (
                    <div className="space-y-3 py-2">
                      <p className="text-sm text-rose-600 dark:text-rose-400">
                        {notificationPanel.message}
                      </p>
                      <button
                        type="button"
                        className="text-sm font-medium text-accent hover:underline"
                        onClick={() => {
                          setNotificationPanel({ status: "loading" });
                          void (async () => {
                            try {
                              const invitations = await fetchNotificationSummary();
                              setNotificationPanel({ status: "ready", invitations });
                              setInvitationBadgeCount(invitations.length);
                            } catch (error) {
                              setNotificationPanel({
                                status: "error",
                                message:
                                  error instanceof Error
                                    ? error.message
                                    : "Something went wrong.",
                              });
                            }
                          })();
                        }}
                      >
                        Try again
                      </button>
                    </div>
                  ) : null}

                  {notificationPanel.status === "ready" &&
                  notificationPanel.invitations.length === 0 ? (
                    <div className="space-y-3 py-1">
                      <p className="text-sm leading-relaxed text-muted">
                        You&apos;re all caught up. Pending space invitations will show here.
                      </p>
                      <Link
                        href={`${getSettingsHref()}?section=invitations`}
                        className="inline-flex text-sm font-medium text-accent hover:underline"
                        onClick={() => setIsNotificationMenuOpen(false)}
                      >
                        Open invitations
                      </Link>
                    </div>
                  ) : null}

                  {notificationPanel.status === "ready" &&
                  notificationPanel.invitations.length > 0 ? (
                    <ul className="space-y-2">
                      {notificationPanel.invitations.slice(0, 6).map((invite) => (
                        <li key={invite.id}>
                          <Link
                            href={`${getSettingsHref()}?section=invitations#invite-${invite.id}`}
                            className="block rounded-xl border border-transparent px-2 py-2 transition-colors hover:border-border hover:bg-panel-muted"
                            onClick={() => setIsNotificationMenuOpen(false)}
                          >
                            <p className="text-sm font-semibold text-foreground">
                              {invite.spaceName}
                            </p>
                            <p className="mt-0.5 text-xs text-muted">
                              {formatRoleLabel(invite.role)} · from {invite.invitedByName}
                            </p>
                            <p className="mt-1 text-[11px] text-muted">Expires {invite.expiresAt}</p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>

                {notificationPanel.status === "ready" &&
                notificationPanel.invitations.length > 0 ? (
                  <div className="mt-3 border-t border-border pt-3">
                    <Link
                      href={`${getSettingsHref()}?section=invitations`}
                      className="text-sm font-medium text-accent hover:underline"
                      onClick={() => setIsNotificationMenuOpen(false)}
                    >
                      View all invitations
                    </Link>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => {
              setIsProfileMenuOpen((current) => !current);
              setIsNotificationMenuOpen(false);
            }}
            className="inline-flex h-10 w-10 touch-manipulation items-center justify-center overflow-hidden rounded-full border border-border bg-panel text-sm font-semibold text-foreground shadow-[0_6px_16px_rgba(15,23,42,0.06)] lg:h-11 lg:w-11 lg:rounded-2xl lg:shadow-[0_8px_20px_rgba(15,23,42,0.04)]"
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
            <div className="absolute right-0 top-full z-50 mt-2 w-[min(calc(100vw-2rem),18rem)] rounded-[1.35rem] border border-border bg-panel p-4 shadow-[0_18px_40px_rgba(15,23,42,0.12)] sm:mt-3 sm:rounded-[1.75rem]">
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
                {SETTINGS_BILLING_SECTION_ENABLED ? (
                  <Link
                    href={`${getSettingsHref()}?section=subscription`}
                    className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-panel-muted"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    <CreditCard className="h-4 w-4 text-muted" />
                    <span>Billing</span>
                  </Link>
                ) : null}
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
      </div>
    </header>
  );
}
