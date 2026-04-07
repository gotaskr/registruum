import Link from "next/link";
import { FolderTree, ShieldCheck, Sparkles, Workflow } from "lucide-react";
import type { ReactNode } from "react";

type AuthShellIntent = "sign-in" | "sign-up" | "verify-email";

type AuthShellProps = Readonly<{
  title: string;
  description: string;
  footer: ReactNode;
  children: ReactNode;
  intent?: AuthShellIntent;
}>;

const shellCopy: Record<
  AuthShellIntent,
  {
    label: string;
    headline: string;
    summary: string;
    note: string;
    statLabel: string;
    statValue: string;
  }
> = {
  "sign-in": {
    label: "Secure Access",
    headline: "Walk back into the workspace without losing your rhythm.",
    summary:
      "Track spaces, work orders, team access, and archive activity from one clean control surface.",
    note: "",
    statLabel: "Workspace Pulse",
    statValue: "24/7 synced access",
  },
  "sign-up": {
    label: "New Workspace",
    headline: "Set up your Registruum identity and start organizing operations cleanly.",
    summary:
      "Create your account to manage spaces, route work orders, structure teams, and keep archived records in one place.",
    note: "",
    statLabel: "Launch Ready",
    statValue: "Spaces, teams, archive",
  },
  "verify-email": {
    label: "Account Checkpoint",
    headline: "One final confirmation keeps the rest of the system secure.",
    summary:
      "Email verification protects invitations, team roles, and sensitive workspace access before you step inside.",
    note: "",
    statLabel: "Protection Layer",
    statValue: "Verified access only",
  },
};

export function AuthShell({
  title,
  description,
  footer,
  children,
  intent = "sign-in",
}: AuthShellProps) {
  const copy = shellCopy[intent];

  return (
    <div className="auth-shell-bg min-h-screen">
      <div className="auth-grid-overlay absolute inset-0 pointer-events-none" />

      <div className="relative grid min-h-screen lg:grid-cols-[minmax(0,1.05fr)_34rem]">
        <section className="relative hidden overflow-hidden border-r border-border/60 lg:flex">
          <div className="auth-orb left-[-8rem] top-[-6rem] h-72 w-72 bg-accent/18" />
          <div className="auth-orb auth-orb-delay bottom-[-7rem] right-[-5rem] h-80 w-80 bg-[#7aa2ff]/20" />

          <div className="relative flex w-full flex-col justify-between px-12 py-12 xl:px-16">
            <div className="auth-enter space-y-10">
              <Link href="/" className="inline-flex items-center gap-4">
                <span className="inline-flex h-16 w-16 items-center justify-center rounded-[1.45rem] bg-[#4d8dff] text-2xl font-semibold text-white shadow-[0_22px_44px_rgba(77,141,255,0.28)]">
                  R
                </span>
                <div>
                  <p className="text-[0.75rem] font-semibold uppercase tracking-[0.32em] text-muted">
                    Registruum
                  </p>
                  <p className="mt-2 max-w-sm text-lg leading-8 text-foreground/88">
                    {copy.headline}
                  </p>
                </div>
              </Link>

              <div className="max-w-xl space-y-5">
                <p className="text-[0.75rem] font-semibold uppercase tracking-[0.28em] text-accent">
                  {copy.label}
                </p>
                <h2 className="max-w-2xl text-5xl font-semibold leading-[1.05] tracking-[-0.04em] text-foreground">
                  {copy.summary}
                </h2>
                {copy.note ? <p className="max-w-lg text-base leading-8 text-muted">{copy.note}</p> : null}
              </div>
            </div>

            <div className="max-w-2xl -translate-y-8 xl:-translate-y-10">
              <div className="auth-float-card rounded-[2rem] border border-border/70 bg-panel p-7 shadow-[0_28px_70px_rgba(15,23,42,0.08)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-muted">
                      {copy.statLabel}
                    </p>
                    <p className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                      {copy.statValue}
                    </p>
                  </div>
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                    <Sparkles className="h-5 w-5" />
                  </span>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-[1.35rem] border border-border bg-panel-muted px-4 py-4">
                    <Workflow className="h-4 w-4 text-accent" />
                    <p className="mt-3 text-sm font-semibold text-foreground">Workflows</p>
                    <p className="mt-1 text-xs leading-5 text-muted">Team roles stay structured.</p>
                  </div>
                  <div className="rounded-[1.35rem] border border-border bg-panel-muted px-4 py-4">
                    <FolderTree className="h-4 w-4 text-accent" />
                    <p className="mt-3 text-sm font-semibold text-foreground">Archive Tree</p>
                    <p className="mt-1 text-xs leading-5 text-muted">Nested folders, clean retrieval.</p>
                  </div>
                  <div className="rounded-[1.35rem] border border-border bg-panel-muted px-4 py-4">
                    <ShieldCheck className="h-4 w-4 text-accent" />
                    <p className="mt-3 text-sm font-semibold text-foreground">Protected Access</p>
                    <p className="mt-1 text-xs leading-5 text-muted">Controlled by role and invite.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center px-4 py-6 sm:px-8 lg:px-10 xl:px-14">
          <div className="mx-auto w-full max-w-[34rem] auth-enter auth-enter-delay">
            <div className="auth-panel-glow relative rounded-[2rem] border border-border/70 bg-panel p-5 shadow-[0_30px_80px_rgba(15,23,42,0.1)] sm:p-7 lg:p-8">
              <div className="mb-8 flex items-center justify-between gap-4">
                <Link href="/" className="inline-flex items-center gap-3">
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-[1.35rem] bg-[#4d8dff] text-xl font-semibold text-white shadow-[0_16px_36px_rgba(77,141,255,0.28)]">
                    R
                  </span>
                  <div>
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-muted">
                      Registruum
                    </p>
                    <p className="mt-2 text-sm text-muted">Operations access for modern teams</p>
                  </div>
                </Link>

                <div className="hidden rounded-full border border-border bg-panel-muted px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-muted sm:block">
                  {copy.label}
                </div>
              </div>

              <div className="mb-7 grid gap-3 lg:hidden">
                <div className="rounded-[1.6rem] border border-border bg-panel-muted/90 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-muted">
                        {copy.statLabel}
                      </p>
                      <p className="mt-2 text-lg font-semibold text-foreground">{copy.statValue}</p>
                    </div>
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                      <Sparkles className="h-4 w-4" />
                    </span>
                  </div>
                  {copy.note ? <p className="mt-4 text-sm leading-6 text-muted">{copy.note}</p> : null}
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-[2.8rem]">
                  {title}
                </h1>
                <p className="max-w-xl text-base leading-8 text-muted">{description}</p>
              </div>

              <div className="mt-8 rounded-[1.75rem] border border-border bg-panel-muted/80 p-5 sm:p-6">
                {children}
              </div>

              <div className="mt-6 text-sm leading-7 text-muted">{footer}</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
