import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, MailCheck, ShieldCheck } from "lucide-react";
import { AuthShell } from "@/features/auth/ui/auth-shell";
import { AuthPageFooter } from "@/features/auth/ui/auth-page-footer";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type VerifyEmailPageProps = Readonly<{
  searchParams: Promise<{
    email?: string;
    next?: string;
  }>;
}>;

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const { email, next } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email_confirmed_at) {
    redirect(next ?? "/");
  }

  return (
    <AuthShell
      intent="verify-email"
      title="Verify your email"
      description="We've created your account. Finish setup by confirming your email address before you continue."
      cardFooter={
        <>
          Already verified your email?{" "}
          <Link href={next ?? "/"} className="font-medium text-foreground">
            Continue to dashboard
          </Link>
          .
        </>
      }
      pageFooter={<AuthPageFooter />}
    >
      <div className="space-y-4">
        <div className="rounded-[1.75rem] border border-border bg-panel-muted p-5">
          <div className="flex items-start gap-4">
            <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent">
              <MailCheck className="h-5 w-5" />
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
                  Verification Sent
                </p>
                <p className="mt-2 text-base font-semibold text-foreground">
                  Check {email ?? "your inbox"} for the confirmation email
                </p>
              </div>
              <p className="text-sm leading-6 text-muted">
                Open the email from Registruum and click the verification link. After that, you can
                continue straight into your dashboard.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-border bg-panel p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <div className="space-y-2 text-sm text-muted">
              <p className="font-semibold text-foreground">Before you continue</p>
              <p>Check your inbox and spam folder if the email does not arrive right away.</p>
              <p>The account stays locked until the email link is confirmed.</p>
            </div>
          </div>
        </div>

        <Link
          href={next ?? "/"}
          className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-[1.3rem] bg-slate-950 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(15,23,42,0.16)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_40px_rgba(15,23,42,0.2)]"
        >
          I&apos;ve verified my email
          <ArrowRight className="h-4 w-4" />
        </Link>

        <p className="text-xs text-muted">
          If email verification is disabled in your current environment, this screen is still the
          next step after sign up and you can continue once verification is available.
        </p>
      </div>
    </AuthShell>
  );
}
