"use client";

import { useActionState, useEffect, useState, useSyncExternalStore } from "react";
import {
  AtSign,
  Building2,
  Globe,
  Landmark,
  Link2,
  Mail,
  MapPin,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormMessage } from "@/features/auth/ui/form-message";
import { updateProfileCompany } from "@/features/settings/actions/profile.actions";
import { SettingsCard } from "@/features/settings/ui/settings-card";
import {
  initialProfileActionState,
} from "@/features/settings/types/profile-action-state";
import type { Profile } from "@/types/profile";

type ProfileCompanyCardProps = Readonly<{
  profile: Profile;
}>;

function subscribeToHydration() {
  return () => {};
}

export function ProfileCompanyCard({
  profile,
}: ProfileCompanyCardProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    updateProfileCompany,
    initialProfileActionState,
  );
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const [representsCompany, setRepresentsCompany] = useState(profile.representsCompany);

  useEffect(() => {
    if (!state.success) {
      return;
    }

    router.refresh();
  }, [router, state.success]);

  return (
    <SettingsCard
      label="Company"
      title="Representation details"
      description="Add company information when this identity is acting on behalf of an organization."
    >
      <form action={formAction} className="grid gap-5">
        <input
          type="hidden"
          name="representsCompany"
          value={representsCompany ? "true" : "false"}
        />
        <div className="flex items-start justify-between gap-4 rounded-[1.5rem] border border-border bg-panel-muted px-5 py-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-accent" />
              <p className="text-sm font-medium text-foreground">
                Representing a company
              </p>
            </div>
            <p className="text-sm leading-6 text-muted">
              Add organization details, website, and social links when acting on behalf of a company.
            </p>
          </div>

          {isHydrated ? (
            <button
              type="button"
              role="switch"
              aria-checked={representsCompany}
              onClick={() => setRepresentsCompany((value) => !value)}
              className={[
                "relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors duration-150",
                representsCompany ? "bg-accent" : "bg-border-strong",
              ].join(" ")}
            >
              <span
                className={[
                  "absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-panel shadow-sm transition-transform duration-150 dark:shadow-none",
                  representsCompany ? "translate-x-5" : "translate-x-0",
                ].join(" ")}
              />
            </button>
          ) : (
            <div
              aria-hidden="true"
              className={[
                "relative inline-flex h-7 w-12 shrink-0 rounded-full",
                profile.representsCompany ? "bg-accent" : "bg-border-strong",
              ].join(" ")}
            >
              <span
                className={[
                  "absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-panel shadow-sm dark:shadow-none",
                  profile.representsCompany ? "translate-x-5" : "translate-x-0",
                ].join(" ")}
              />
            </div>
          )}
        </div>

        <div
          className={[
            "grid transition-all duration-200 ease-out",
            representsCompany ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          ].join(" ")}
        >
          <div className="overflow-hidden">
            <div className="rounded-[1.6rem] border border-border bg-panel p-5 shadow-[0_12px_24px_rgba(15,23,42,0.04)] dark:shadow-none">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 md:col-span-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
                    Company Name
                  </span>
                  <div className="relative">
                    <input
                      name="companyName"
                      type="text"
                      required={representsCompany}
                      defaultValue={profile.companyName ?? ""}
                      placeholder="Registered company name"
                      className="h-12 w-full rounded-2xl border border-border bg-panel-muted px-4 pl-11 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent focus:bg-panel"
                    />
                    <Landmark className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  </div>
                </label>

                <label className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
                    Company Email
                  </span>
                  <div className="relative">
                    <input
                      name="companyEmail"
                      type="email"
                      defaultValue={profile.companyEmail ?? ""}
                      placeholder="company@example.com"
                      className="h-12 w-full rounded-2xl border border-border bg-panel-muted px-4 pl-11 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent focus:bg-panel"
                    />
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  </div>
                </label>

                <label className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
                    Company Website
                  </span>
                  <div className="relative">
                    <input
                      name="companyWebsite"
                      type="url"
                      defaultValue={profile.companyWebsite ?? ""}
                      placeholder="https://company.com"
                      className="h-12 w-full rounded-2xl border border-border bg-panel-muted px-4 pl-11 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent focus:bg-panel"
                    />
                    <Globe className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  </div>
                </label>

                <label className="space-y-2 md:col-span-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
                    Company Address
                  </span>
                  <div className="relative">
                    <input
                      name="companyAddress"
                      type="text"
                      defaultValue={profile.companyAddress ?? ""}
                      placeholder="Street, city, province/state, postal code"
                      className="h-12 w-full rounded-2xl border border-border bg-panel-muted px-4 pl-11 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent focus:bg-panel"
                    />
                    <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  </div>
                </label>

                <label className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
                    Facebook
                  </span>
                  <div className="relative">
                    <input
                      name="companyFacebookUrl"
                      type="url"
                      defaultValue={profile.companyFacebookUrl ?? ""}
                      placeholder="https://facebook.com/your-company"
                      className="h-12 w-full rounded-2xl border border-border bg-panel-muted px-4 pl-11 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent focus:bg-panel"
                    />
                    <Link2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  </div>
                </label>

                <label className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
                    X
                  </span>
                  <div className="relative">
                    <input
                      name="companyXUrl"
                      type="url"
                      defaultValue={profile.companyXUrl ?? ""}
                      placeholder="https://x.com/your-company"
                      className="h-12 w-full rounded-2xl border border-border bg-panel-muted px-4 pl-11 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent focus:bg-panel"
                    />
                    <AtSign className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  </div>
                </label>

                <label className="space-y-2 md:col-span-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
                    Instagram
                  </span>
                  <div className="relative">
                    <input
                      name="companyInstagramUrl"
                      type="url"
                      defaultValue={profile.companyInstagramUrl ?? ""}
                      placeholder="https://instagram.com/your-company"
                      className="h-12 w-full rounded-2xl border border-border bg-panel-muted px-4 pl-11 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent focus:bg-panel"
                    />
                    <Link2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        <FormMessage
          message={state.error ?? state.success}
          tone={state.error ? "error" : "info"}
        />

        <div className="flex justify-end border-t border-border pt-4">
          <button
            type="submit"
            disabled={isPending}
            suppressHydrationWarning
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-accent px-5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(31,95,255,0.24)] disabled:opacity-60 dark:shadow-none"
          >
            {isPending ? "Saving..." : "Save Company Details"}
          </button>
        </div>
      </form>
    </SettingsCard>
  );
}
