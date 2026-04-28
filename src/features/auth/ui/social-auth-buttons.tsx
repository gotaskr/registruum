"use client";

import Link from "next/link";

type SocialAuthButtonsProps = Readonly<{
  intent: "sign-in" | "sign-up";
  next?: string;
}>;

const providers = [
  { id: "google", label: "Google" },
  { id: "linkedin", label: "LinkedIn" },
] as const;

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        d="M21.35 11.1H12v2.98h5.35c-.23 1.5-1.78 4.4-5.35 4.4a5.97 5.97 0 1 1 0-11.94c2.03 0 3.39.87 4.17 1.62l2.84-2.74A9.72 9.72 0 0 0 12 2.5a9.5 9.5 0 1 0 0 19c5.48 0 9.1-3.85 9.1-9.27 0-.62-.07-1.08-.15-1.53Z"
        fill="currentColor"
      />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.606 0 4.277 2.373 4.277 5.452v6.289zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24H22.23C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function ProviderIcon({
  providerId,
}: Readonly<{
  providerId: (typeof providers)[number]["id"];
}>) {
  if (providerId === "google") {
    return <GoogleIcon />;
  }

  return <LinkedInIcon />;
}

function buildHref(input: { provider: string; intent: "sign-in" | "sign-up"; next?: string }) {
  const params = new URLSearchParams({
    provider: input.provider,
    intent: input.intent,
  });

  if (input.next) {
    params.set("next", input.next);
  }

  return `/auth/oauth?${params.toString()}`;
}

export function SocialAuthButtons({
  intent,
  next,
}: SocialAuthButtonsProps) {
  return (
    <div className="space-y-3">
      {providers.map((provider) => (
        <Link
          key={provider.id}
          href={buildHref({
            provider: provider.id,
            intent,
            next,
          })}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[1.1rem] border border-border bg-panel text-sm font-semibold text-foreground transition-colors hover:bg-panel-muted"
        >
          <ProviderIcon providerId={provider.id} />
          Continue with {provider.label}
        </Link>
      ))}
    </div>
  );
}
