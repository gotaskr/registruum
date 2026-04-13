import type { ReactNode } from "react";
import Image from "next/image";
import { CheckCircle2, ExternalLink, Globe, Mail, Sparkles } from "lucide-react";
import { ProfileActivityCard } from "@/features/settings/ui/profile-activity-card";
import { ProfileCompanyCard } from "@/features/settings/ui/profile-company-card";
import { ProfileDisplayIdentityCard } from "@/features/settings/ui/profile-display-identity-card";
import { ProfileIdentityCard } from "@/features/settings/ui/profile-identity-card";
import { getInitials } from "@/lib/utils";
import type { Profile } from "@/types/profile";

type ProfileSettingsSectionProps = Readonly<{
  profile: Profile;
}>;

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M13.135 21v-8.2h2.726l.408-3.197h-3.134V7.561c0-.926.257-1.557 1.586-1.557H16.6V3.145C16.276 3.1 15.164 3 13.87 3c-2.703 0-4.554 1.65-4.554 4.682v2.621H6.25V12.8h3.066V21h3.819Z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M18.901 2H21l-4.584 5.24L21.81 22h-4.224l-3.309-4.332L10.487 22H8.386l4.902-5.603L8 2h4.331l2.991 3.922L18.901 2Zm-.737 18.743h1.164L11.7 3.194h-1.25l7.714 17.549Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" strokeWidth="2" />
      <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function normalizeExternalHref(value: string | null) {
  if (!value) {
    return null;
  }

  return value.startsWith("http://") || value.startsWith("https://")
    ? value
    : `https://${value}`;
}

export function ProfileSettingsSection({
  profile,
}: ProfileSettingsSectionProps) {
  const companyWebsiteHref = normalizeExternalHref(profile.companyWebsite);
  const companySocials: ReadonlyArray<{
    href: string;
    label: string;
    icon: ReactNode;
  }> = [
    {
      href: normalizeExternalHref(profile.companyFacebookUrl),
      label: "Facebook",
      icon: <FacebookIcon />,
    },
    {
      href: normalizeExternalHref(profile.companyXUrl),
      label: "X",
      icon: <XIcon />,
    },
    {
      href: normalizeExternalHref(profile.companyInstagramUrl),
      label: "Instagram",
      icon: <InstagramIcon />,
    },
  ].flatMap((item) => (item.href ? [{ ...item, href: item.href }] : []));
  const hasCompanyPresence =
    Boolean(profile.companyName) || Boolean(companyWebsiteHref) || companySocials.length > 0;

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="overflow-hidden rounded-xl border border-border bg-panel shadow-sm sm:rounded-[2rem] sm:shadow-[0_18px_36px_rgba(15,23,42,0.05)] dark:shadow-none dark:sm:shadow-none">
        <div className="border-b border-border bg-panel-muted px-4 py-4 sm:px-6 sm:py-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted sm:text-[11px] sm:tracking-[0.24em]">
            Profile
          </p>
          <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-foreground sm:mt-2 sm:text-[1.6rem]">
            Registruum identity hub
          </h2>
          <p className="mt-2 hidden max-w-2xl text-sm leading-6 text-muted sm:block">
            Manage the identity, company representation, and signature surfaces that follow you across spaces, work orders, and audit history.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted sm:hidden">
            Identity, company presence, and signatures across spaces and work orders.
          </p>
        </div>

        <div className="grid gap-4 px-4 py-4 sm:gap-5 sm:px-6 sm:py-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
          <div className="rounded-xl border border-border bg-panel p-4 sm:rounded-[1.6rem] sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-accent-soft text-lg font-semibold text-accent sm:h-20 sm:w-20 sm:rounded-[1.5rem] sm:text-xl">
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

              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold leading-snug text-foreground sm:text-2xl">
                  {profile.fullName}
                </h3>
                <div className="mt-2 flex flex-col gap-2 text-sm text-muted sm:flex-row sm:flex-wrap sm:items-center">
                  <span className="inline-flex min-w-0 items-center gap-2 rounded-full bg-panel-muted px-3 py-1.5">
                    <Mail className="h-4 w-4 shrink-0 text-accent" />
                    <span className="truncate">{profile.email}</span>
                  </span>
                  <span className="inline-flex w-fit items-center gap-2 rounded-full bg-success-soft px-3 py-1.5 text-success-text">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    {profile.emailVerifiedAt ? "Verified account" : "Verification pending"}
                  </span>
                </div>
              </div>
            </div>

            {hasCompanyPresence ? (
              <div className="mt-4 rounded-xl border border-border bg-panel-muted p-3 sm:mt-5 sm:rounded-[1.5rem] sm:p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted sm:text-[11px] sm:tracking-[0.22em]">
                  Company Presence
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                  {profile.companyName ? (
                    <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-panel px-3 py-2 text-sm font-semibold text-foreground shadow-sm dark:shadow-none">
                      <Sparkles className="h-4 w-4 shrink-0 text-accent" />
                      <span className="truncate">{profile.companyName}</span>
                    </span>
                  ) : null}

                  {companyWebsiteHref ? (
                    <a
                      href={companyWebsiteHref}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-panel px-3 py-2 text-sm font-medium text-accent transition hover:bg-accent-soft dark:shadow-none"
                    >
                      <Globe className="h-4 w-4 shrink-0" />
                      <span className="min-w-0 max-w-[min(100%,15rem)] truncate sm:max-w-[15rem]">
                        {profile.companyWebsite}
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    </a>
                  ) : null}

                  {companySocials.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {companySocials.map((social) => (
                        <a
                          key={social.label}
                          href={social.href}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={social.label}
                          title={social.label}
                          className="inline-flex h-10 w-10 touch-manipulation items-center justify-center rounded-full border border-border bg-panel text-accent shadow-sm transition active:scale-[0.98] hover:bg-accent-soft dark:shadow-none"
                        >
                          {social.icon}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-1">
            <div className="rounded-xl border border-border bg-panel-muted px-3 py-3 sm:rounded-[1.5rem] sm:px-4 sm:py-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted sm:text-[11px] sm:tracking-[0.22em]">
                User Tag
              </p>
              <p className="mt-2 break-all font-mono text-xs font-semibold tracking-[0.12em] text-foreground sm:mt-3 sm:text-sm sm:tracking-[0.14em]">
                {profile.userTag}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-panel-muted px-3 py-3 sm:rounded-[1.5rem] sm:px-4 sm:py-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted sm:text-[11px] sm:tracking-[0.22em]">
                Company Mode
              </p>
              <p className="mt-2 text-sm font-medium text-foreground sm:mt-3">
                {profile.representsCompany ? "Enabled" : "Personal"}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-panel-muted px-3 py-3 sm:col-span-2 sm:rounded-[1.5rem] sm:px-4 sm:py-4 lg:col-span-1">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 shrink-0 text-accent" />
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted sm:text-[11px] sm:tracking-[0.22em]">
                  Presence
                </p>
              </div>
              <p className="mt-2 text-sm font-medium leading-snug text-foreground sm:mt-3">
                {profile.companyName ?? "Build out your account identity"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <ProfileIdentityCard
        key={`identity-${profile.updatedAt}-${profile.avatarPath ?? "no-avatar"}`}
        profile={profile}
      />
      <ProfileCompanyCard
        key={`company-${profile.updatedAt}-${profile.representsCompany ? "on" : "off"}`}
        profile={profile}
      />
      <ProfileActivityCard profile={profile} />
      <ProfileDisplayIdentityCard
        key={`display-${profile.updatedAt}-${profile.displayName ?? profile.fullName}`}
        profile={profile}
      />
    </div>
  );
}
