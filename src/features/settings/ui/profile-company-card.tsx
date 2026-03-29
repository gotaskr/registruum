"use client";

import { useActionState, useEffect, useState } from "react";
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

export function ProfileCompanyCard({
  profile,
}: ProfileCompanyCardProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    updateProfileCompany,
    initialProfileActionState,
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
      <form action={formAction} className="grid gap-4">
        <input
          type="hidden"
          name="representsCompany"
          value={representsCompany ? "true" : "false"}
        />
        <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-panel-muted px-4 py-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Representing a company
            </p>
            <p className="text-sm text-muted">
              Add organization details when acting on behalf of a company.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={representsCompany}
            onClick={() => setRepresentsCompany((value) => !value)}
            className={[
              "relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-150",
              representsCompany ? "bg-slate-900" : "bg-slate-300",
            ].join(" ")}
          >
            <span
              className={[
                "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-150",
                representsCompany ? "translate-x-5" : "translate-x-0",
              ].join(" ")}
            />
          </button>
        </div>

        <div
          className={[
            "grid transition-all duration-200 ease-out",
            representsCompany ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          ].join(" ")}
        >
          <div className="overflow-hidden">
            <div className="rounded-lg border border-border bg-panel-muted/70 px-4 py-4">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-2 md:col-span-2">
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
                    Company Name
                  </span>
                  <input
                    name="companyName"
                    type="text"
                    required={representsCompany}
                    defaultValue={profile.companyName ?? ""}
                    placeholder="Registered company name"
                    className="h-10 w-full rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
                    Company Email
                  </span>
                  <input
                    name="companyEmail"
                    type="email"
                    defaultValue={profile.companyEmail ?? ""}
                    placeholder="company@example.com"
                    className="h-10 w-full rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none"
                  />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
                    Company Address
                  </span>
                  <input
                    name="companyAddress"
                    type="text"
                    defaultValue={profile.companyAddress ?? ""}
                    placeholder="Street, city, province/state, postal code"
                    className="h-10 w-full rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none"
                  />
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
            className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isPending ? "Saving..." : "Save Company Details"}
          </button>
        </div>
      </form>
    </SettingsCard>
  );
}
