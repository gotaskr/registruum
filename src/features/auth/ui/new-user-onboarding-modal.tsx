"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { completeBasicProfileOnboarding } from "@/features/settings/actions/profile.actions";
import { initialProfileActionState } from "@/features/settings/types/profile-action-state";
import type { Profile } from "@/types/profile";

type NewUserOnboardingModalProps = Readonly<{
  profile: Profile;
}>;

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export function NewUserOnboardingModal({ profile }: NewUserOnboardingModalProps) {
  const [state, formAction, isPending] = useActionState(
    completeBasicProfileOnboarding,
    initialProfileActionState,
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const initialName = useMemo(() => splitName(profile.fullName), [profile.fullName]);
  const [firstName, setFirstName] = useState(initialName.firstName);
  const [lastName, setLastName] = useState(initialName.lastName);
  const [hasBusiness, setHasBusiness] = useState<boolean | null>(null);
  const [companyName, setCompanyName] = useState(profile.companyName ?? "");
  const [companyEmail, setCompanyEmail] = useState(profile.companyEmail ?? "");
  const [companyAddress, setCompanyAddress] = useState(profile.companyAddress ?? "");
  const [companyWebsite, setCompanyWebsite] = useState(profile.companyWebsite ?? "");
  const [localError, setLocalError] = useState<string | null>(null);
  const likelyNewAccount = useMemo(() => {
    const createdAt = new Date(profile.createdAt).getTime();
    if (!Number.isFinite(createdAt)) {
      return false;
    }
    const ageMs = Date.now() - createdAt;
    const within7Days = ageMs >= 0 && ageMs <= 7 * 24 * 60 * 60 * 1000;
    return (
      within7Days &&
      !profile.onboardingCompletedAt &&
      !profile.companyName &&
      !profile.displayName
    );
  }, [profile.companyName, profile.createdAt, profile.displayName, profile.onboardingCompletedAt]);

  useEffect(() => {
    if (!likelyNewAccount) {
      return;
    }
    setIsOpen(true);
  }, [likelyNewAccount]);

  useEffect(() => {
    if (!state.success) {
      return;
    }
    setIsOpen(false);
    setIsPromptOpen(true);
  }, [state.success]);

  if (!likelyNewAccount) {
    return null;
  }

  return (
    <>
      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={step === 1 ? "Let's complete your basic profile" : "Business details"}
        description={
          step === 1
            ? "How may I call you? You can keep this as-is or adjust it."
            : "Are you running a business or part of one? Share a few details to personalize your account."
        }
        panelClassName="max-w-xl"
        bottomSheetOnNarrow
      >
        <form action={formAction} className="space-y-4 px-5 py-4">
          <input type="hidden" name="firstName" value={firstName} />
          <input type="hidden" name="lastName" value={lastName} />
          <input type="hidden" name="hasBusiness" value={hasBusiness ? "true" : "false"} />
          <input type="hidden" name="companyName" value={companyName} />
          <input type="hidden" name="companyEmail" value={companyEmail} />
          <input type="hidden" name="companyAddress" value={companyAddress} />
          <input type="hidden" name="companyWebsite" value={companyWebsite} />

          {step === 1 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                  First name
                </span>
                <input
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none focus:border-accent"
                  placeholder="First name"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Last name
                </span>
                <input
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none focus:border-accent"
                  placeholder="Last name"
                />
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Do you have a business or are you part of one?
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={hasBusiness === true ? "brand" : "secondary"}
                    onClick={() => setHasBusiness(true)}
                  >
                    Yes
                  </Button>
                  <Button
                    type="button"
                    variant={hasBusiness === false ? "brand" : "secondary"}
                    onClick={() => setHasBusiness(false)}
                  >
                    No
                  </Button>
                </div>
              </div>

              {hasBusiness ? (
                <div className="grid gap-3">
                  <label className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                      Business name
                    </span>
                    <input
                      value={companyName}
                      onChange={(event) => setCompanyName(event.target.value)}
                      className="h-10 w-full rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none focus:border-accent"
                      placeholder="Your business name"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                      Business email
                    </span>
                    <input
                      value={companyEmail}
                      onChange={(event) => setCompanyEmail(event.target.value)}
                      className="h-10 w-full rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none focus:border-accent"
                      placeholder="name@business.com"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                      Business address
                    </span>
                    <input
                      value={companyAddress}
                      onChange={(event) => setCompanyAddress(event.target.value)}
                      className="h-10 w-full rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none focus:border-accent"
                      placeholder="Business address"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                      Business website
                    </span>
                    <input
                      value={companyWebsite}
                      onChange={(event) => setCompanyWebsite(event.target.value)}
                      className="h-10 w-full rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none focus:border-accent"
                      placeholder="https://example.com"
                    />
                  </label>
                </div>
              ) : null}
            </div>
          )}

          {localError ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {localError}
            </p>
          ) : null}
          {state.error ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {state.error}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            {step === 1 ? (
              <Button
                type="button"
                onClick={() => {
                  const nextFirst = firstName.trim();
                  const nextLast = lastName.trim();
                  if (!nextFirst || !nextLast) {
                    setLocalError("Please enter your first and last name.");
                    return;
                  }
                  setLocalError(null);
                  setFirstName(nextFirst);
                  setLastName(nextLast);
                  setStep(2);
                }}
              >
                Next
              </Button>
            ) : (
              <>
                <Button type="button" variant="secondary" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="brand"
                  disabled={isPending}
                  onClick={() => {
                    if (hasBusiness === null) {
                      setLocalError("Please select if you have a business.");
                      return;
                    }
                    if (hasBusiness && !companyName.trim()) {
                      setLocalError("Business name is required.");
                      return;
                    }
                    setLocalError(null);
                  }}
                >
                  {isPending ? "Saving..." : "Finish"}
                </Button>
              </>
            )}
          </div>
        </form>
      </Modal>

      <Modal
        open={isPromptOpen}
        onClose={() => setIsPromptOpen(false)}
        title="Profile started"
        description="Your basic profile is saved. Want to complete the rest now?"
        panelClassName="max-w-md"
      >
        <div className="space-y-4 px-5 py-4">
          <p className="text-sm text-muted">
            Go to Profile Settings to add more details anytime.
          </p>
          <div className="flex items-center justify-end">
            <Link href="/settings" onClick={() => setIsPromptOpen(false)}>
              <Button variant="brand">Go to Profile</Button>
            </Link>
          </div>
        </div>
      </Modal>
    </>
  );
}
