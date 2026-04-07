"use client";

import Link from "next/link";
import { ArrowRight, KeyRound, Mail } from "lucide-react";
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
    <form action={formAction} className="space-y-5">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <FormMessage message={message} tone="info" />
      <FormMessage message={state.error} />

      <div className="grid gap-4">
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

        <label className="block space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[0.82rem] font-semibold uppercase tracking-[0.18em] text-muted">
              Password
            </span>
            <span className="text-xs text-muted">Secure account access</span>
          </div>
          <span className="auth-input-shell flex h-14 items-center gap-3 rounded-[1.2rem] border border-border bg-panel px-4 transition-colors focus-within:border-accent focus-within:bg-background">
            <KeyRound className="h-4 w-4 text-muted" />
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              className="h-full w-full bg-transparent text-[0.98rem] text-foreground outline-none placeholder:text-muted/70"
            />
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-[1.3rem] bg-slate-950 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(15,23,42,0.16)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_40px_rgba(15,23,42,0.2)] disabled:opacity-60"
      >
        {isPending ? "Signing in..." : "Sign In"}
        <ArrowRight className="h-4 w-4" />
      </button>

      <div className="grid gap-3 rounded-[1.4rem] border border-border bg-panel px-4 py-4 text-sm text-muted sm:grid-cols-2">
        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-muted">
            After Sign In
          </p>
          <p className="mt-2 leading-6">
            Your spaces, work orders, team roles, and archive visibility load automatically.
          </p>
        </div>
        <div className="rounded-[1.15rem] border border-border bg-panel-muted px-4 py-3">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-muted">
            Workspace Status
          </p>
          <p className="mt-2 leading-6 text-foreground">One identity, synced across operations.</p>
        </div>
      </div>

      <p className="text-sm leading-7 text-muted">
        Don&apos;t have an account?{" "}
        <Link
          href={next ? `/sign-up?next=${encodeURIComponent(next)}` : "/sign-up"}
          className="font-semibold text-foreground transition-colors hover:text-accent"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}
