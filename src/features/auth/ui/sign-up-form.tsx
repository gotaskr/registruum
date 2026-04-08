"use client";

import Link from "next/link";
import { ArrowRight, KeyRound, Mail, User2 } from "lucide-react";
import { useActionState } from "react";
import { signUp } from "@/features/auth/actions/auth.actions";
import { FormMessage } from "@/features/auth/ui/form-message";
import { initialAuthActionState } from "@/features/auth/types/auth-action-state";

type SignUpFormProps = Readonly<{
  next?: string;
}>;

export function SignUpForm({ next }: SignUpFormProps) {
  const [state, formAction, isPending] = useActionState(signUp, initialAuthActionState);

  return (
    <form action={formAction} className="space-y-5">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <FormMessage message={state.error} />

      <div className="grid gap-4">
        <label className="block space-y-2.5">
          <span className="text-[0.82rem] font-semibold uppercase tracking-[0.18em] text-muted">
            Full Name
          </span>
          <span className="auth-input-shell flex h-14 items-center gap-3 rounded-[1.2rem] border border-border bg-panel px-4 transition-colors focus-within:border-accent focus-within:bg-background">
            <User2 className="h-4 w-4 text-muted" />
            <input
              name="fullName"
              type="text"
              autoComplete="name"
              placeholder="Your full name"
              className="h-full w-full bg-transparent text-[0.98rem] text-foreground outline-none placeholder:text-muted/70"
            />
          </span>
        </label>

        <label className="block space-y-2.5">
          <span className="text-[0.82rem] font-semibold uppercase tracking-[0.18em] text-muted">
            Email Address
          </span>
          <span className="auth-input-shell flex h-14 items-center gap-3 rounded-[1.2rem] border border-border bg-panel px-4 transition-colors focus-within:border-accent focus-within:bg-background">
            <Mail className="h-4 w-4 text-muted" />
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@company.com"
              className="h-full w-full bg-transparent text-[0.98rem] text-foreground outline-none placeholder:text-muted/70"
            />
          </span>
        </label>

        <div className="grid gap-4">
          <label className="block space-y-2.5">
            <span className="text-[0.82rem] font-semibold uppercase tracking-[0.18em] text-muted">
              Password
            </span>
            <span className="auth-input-shell flex h-14 items-center gap-3 rounded-[1.2rem] border border-border bg-panel px-4 transition-colors focus-within:border-accent focus-within:bg-background">
              <KeyRound className="h-4 w-4 text-muted" />
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Create password"
                className="h-full w-full bg-transparent text-[0.98rem] text-foreground outline-none placeholder:text-muted/70"
              />
            </span>
          </label>

          <label className="block space-y-2.5">
            <span className="text-[0.82rem] font-semibold uppercase tracking-[0.18em] text-muted">
              Confirm Password
            </span>
            <span className="auth-input-shell flex h-14 items-center gap-3 rounded-[1.2rem] border border-border bg-panel px-4 transition-colors focus-within:border-accent focus-within:bg-background">
              <KeyRound className="h-4 w-4 text-muted" />
              <input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat password"
                className="h-full w-full bg-transparent text-[0.98rem] text-foreground outline-none placeholder:text-muted/70"
              />
            </span>
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-[1.3rem] bg-slate-950 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(15,23,42,0.16)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_40px_rgba(15,23,42,0.2)] disabled:opacity-60"
      >
        {isPending ? "Creating account..." : "Create Account"}
        <ArrowRight className="h-4 w-4" />
      </button>

      <div className="rounded-[1.4rem] border border-border bg-panel px-4 py-4 text-sm text-muted">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-muted">
          Verification Step
        </p>
        <p className="mt-2 leading-6">
          We&apos;ll verify your email before unlocking spaces, invitations, and archive access.
        </p>
      </div>

      <p className="text-sm leading-7 text-muted">
        Already have an account?{" "}
        <Link
          href={next ? `/sign-in?next=${encodeURIComponent(next)}` : "/sign-in"}
          className="font-semibold text-foreground transition-colors hover:text-accent"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
