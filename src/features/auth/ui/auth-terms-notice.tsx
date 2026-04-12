"use client";

import Link from "next/link";

type AuthTermsNoticeProps = Readonly<{
  mode: "sign-in" | "sign-up";
  next?: string;
}>;

export function AuthTermsNotice({ mode, next }: AuthTermsNoticeProps) {
  const authHref =
    mode === "sign-in"
      ? next
        ? `/sign-up?next=${encodeURIComponent(next)}`
        : "/sign-up"
      : next
        ? `/sign-in?next=${encodeURIComponent(next)}`
        : "/sign-in";

  return (
    <div className="space-y-3 text-sm leading-7 text-muted">
      <p>
        {mode === "sign-in" ? "By signing in" : "By signing up"}, you agree to our{" "}
        <Link
          href="/terms-and-conditions"
          className="font-semibold text-foreground transition-colors hover:text-accent"
        >
          Terms and Conditions
        </Link>
        .
      </p>

      <p>
        {mode === "sign-in" ? "Don&apos;t have an account?" : "Already have an account?"}{" "}
        <Link
          href={authHref}
          className="font-semibold text-foreground transition-colors hover:text-accent"
        >
          {mode === "sign-in" ? "Create one" : "Sign in"}
        </Link>
      </p>
    </div>
  );
}
