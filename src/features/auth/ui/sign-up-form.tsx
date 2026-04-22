"use client";

import { ArrowRight, KeyRound, Mail, User2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState, type FormEvent } from "react";
import { syncProfileFromCurrentSession } from "@/features/auth/actions/auth.actions";
import { formatAuthReachabilityError } from "@/features/auth/lib/format-auth-reachability-error";
import { FormMessage } from "@/features/auth/ui/form-message";
import { signUpSchema } from "@/features/auth/schemas/auth.schema";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type SignUpFormProps = Readonly<{
  next?: string;
}>;

export function SignUpForm({ next }: SignUpFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);

      const form = event.currentTarget;
      const formData = new FormData(form);

      const parsed = signUpSchema.safeParse({
        fullName: String(formData.get("fullName") ?? ""),
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        confirmPassword: String(formData.get("confirmPassword") ?? ""),
        next: next || undefined,
      });

      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Unable to create your account.");
        return;
      }

      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const callbackUrl = new URL("/auth/callback", origin || "http://localhost:3000");

      if (parsed.data.next) {
        callbackUrl.searchParams.set("next", parsed.data.next);
      }

      setIsPending(true);

      try {
        const supabase = createSupabaseBrowserClient();
        const result = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: callbackUrl.toString(),
            data: {
              full_name: parsed.data.fullName,
            },
          },
        });

        if (result.error) {
          setError(formatAuthReachabilityError(result.error.message));
          setIsPending(false);
          return;
        }

        const emailConfirmed = !!result.data.user?.email_confirmed_at;

        if (result.data.session && result.data.user && emailConfirmed) {
          await syncProfileFromCurrentSession();
          router.replace(parsed.data.next ?? "/");
          router.refresh();
          return;
        }

        const verifyUrl = new URL("/verify-email", origin || "http://localhost:3000");
        verifyUrl.searchParams.set("email", parsed.data.email);

        if (parsed.data.next) {
          verifyUrl.searchParams.set("next", parsed.data.next);
        }

        router.push(verifyUrl.toString());
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : String(cause);
        setError(formatAuthReachabilityError(message));
      } finally {
        setIsPending(false);
      }
    },
    [next, router],
  );

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {next ? <input type="hidden" name="next" value={next} readOnly /> : null}
      <FormMessage message={error ?? undefined} />

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
    </form>
  );
}
