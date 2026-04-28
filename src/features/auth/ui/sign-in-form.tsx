"use client";

import { ArrowRight, KeyRound, Mail } from "lucide-react";
import { useActionState } from "react";
import { signIn } from "@/features/auth/actions/auth.actions";
import { FormMessage } from "@/features/auth/ui/form-message";
import { isSocialAuthEnabled } from "@/features/auth/lib/social-auth-availability";
import { SocialAuthButtons } from "@/features/auth/ui/social-auth-buttons";
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

      {isSocialAuthEnabled() ? (
        <>
          <div className="flex items-center gap-3 py-1">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Or</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <SocialAuthButtons intent="sign-in" next={next} />
        </>
      ) : null}

    </form>
  );
}
