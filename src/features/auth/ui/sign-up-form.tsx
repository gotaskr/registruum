"use client";

import Link from "next/link";
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
    <form action={formAction} className="space-y-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <FormMessage message={state.error} />
      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">Full Name</span>
        <input
          name="fullName"
          type="text"
          autoComplete="name"
          className="h-11 w-full rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none"
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">Email Address</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          className="h-11 w-full rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none"
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          className="h-11 w-full rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none"
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">Confirm Password</span>
        <input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          className="h-11 w-full rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none"
        />
      </label>
      <p className="text-xs text-muted">
        Passwords must include one uppercase letter, one number, one symbol, and no spaces.
      </p>
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-slate-950 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? "Creating account..." : "Create Account"}
      </button>
      <p className="text-sm text-muted">
        Already have an account?{" "}
        <Link
          href={next ? `/sign-in?next=${encodeURIComponent(next)}` : "/sign-in"}
          className="font-medium text-foreground"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
