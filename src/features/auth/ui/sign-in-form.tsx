"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn } from "@/features/auth/actions/auth.actions";
import { FormMessage } from "@/features/auth/ui/form-message";
import { initialAuthActionState } from "@/features/auth/types/auth-action-state";

type SignInFormProps = Readonly<{
  next?: string;
  message?: string;
}>;

export function SignInForm({ next, message }: SignInFormProps) {
  const [state, formAction, isPending] = useActionState(signIn, initialAuthActionState);

  return (
    <form action={formAction} className="space-y-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <FormMessage message={message} tone="info" />
      <FormMessage message={state.error} />
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
          autoComplete="current-password"
          className="h-11 w-full rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none"
        />
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-slate-950 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? "Signing in..." : "Sign In"}
      </button>
      <p className="text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link
          href={next ? `/sign-up?next=${encodeURIComponent(next)}` : "/sign-up"}
          className="font-medium text-foreground"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}
