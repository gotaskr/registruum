import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, FileText, ShieldCheck } from "lucide-react";
import {
  policySections,
  termsMeta,
  termsSections,
  type TermsSection,
} from "@/features/auth/content/terms";

export const metadata: Metadata = {
  title: "Terms and Conditions | Registruum",
  description: "Review the Registruum Terms and Conditions.",
};

function TermsSectionCard({ section }: Readonly<{ section: TermsSection }>) {
  return (
    <article
      id={section.id}
      className="rounded-[1.75rem] border border-border bg-panel px-5 py-5 shadow-[0_16px_36px_rgba(15,23,42,0.05)] sm:px-6"
    >
      <h2 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
        {section.heading}
      </h2>

      {section.paragraphs?.map((paragraph) => (
        <p key={paragraph} className="mt-4 text-[0.98rem] leading-8 text-muted">
          {paragraph}
        </p>
      ))}

      {section.bullets?.length ? (
        <ul className="mt-4 space-y-3 text-[0.98rem] leading-8 text-muted">
          {section.bullets.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-3 h-2 w-2 shrink-0 rounded-full bg-accent" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {section.ordered?.length ? (
        <ol className="mt-4 space-y-3 text-[0.98rem] leading-8 text-muted">
          {section.ordered.map((item, index) => (
            <li key={item} className="flex gap-3">
              <span className="min-w-6 font-semibold text-foreground">{index + 1}.</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </article>
  );
}

export default function TermsAndConditionsPage() {
  return (
    <main className="auth-shell-bg min-h-screen px-4 py-8 sm:px-8 lg:px-10 xl:px-14">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-panel px-4 py-2 text-sm font-medium text-foreground shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition-colors hover:bg-panel-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>

        <section className="rounded-[2rem] border border-border bg-panel p-6 shadow-[0_30px_80px_rgba(15,23,42,0.1)] sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="space-y-4">
              <p className="text-[0.78rem] font-semibold uppercase tracking-[0.26em] text-accent">
                Terms and Conditions
              </p>
              <h1 className="text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-[3rem]">
                {termsMeta.documentName}
              </h1>
              <p className="max-w-3xl text-base leading-8 text-muted">
                By signing in or creating an account, you agree to the Registruum Terms and
                Conditions shown below.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[1.5rem] border border-border bg-panel-muted px-5 py-5">
                <FileText className="h-5 w-5 text-accent" />
                <p className="mt-3 text-sm font-semibold text-foreground">Effective Date</p>
                <p className="mt-1 text-sm leading-6 text-muted">
                  {termsMeta.effectiveDate}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-border bg-panel-muted px-5 py-5">
                <ShieldCheck className="h-5 w-5 text-accent" />
                <p className="mt-3 text-sm font-semibold text-foreground">Last Updated</p>
                <p className="mt-1 text-sm leading-6 text-muted">
                  {termsMeta.lastUpdated}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-5">
          {termsSections.map((section) => (
            <TermsSectionCard key={section.id} section={section} />
          ))}
        </section>

        <section className="rounded-[2rem] border border-border bg-panel p-6 shadow-[0_30px_80px_rgba(15,23,42,0.1)] sm:p-8">
          <div className="max-w-3xl space-y-3">
            <p className="text-[0.78rem] font-semibold uppercase tracking-[0.26em] text-accent">
              Incorporated Policies
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-foreground">
              Supporting policies included with the Terms.
            </h2>
            <p className="text-base leading-8 text-muted">
              The Terms also reference supporting policy text covering privacy, acceptable use,
              data retention, and subscriptions.
            </p>
          </div>
        </section>

        <section className="space-y-5">
          {policySections.map((section) => (
            <TermsSectionCard key={section.id} section={section} />
          ))}
        </section>
      </div>
    </main>
  );
}
