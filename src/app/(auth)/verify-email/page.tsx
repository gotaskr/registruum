import { redirect } from "next/navigation";
import { MailCheck, ShieldCheck } from "lucide-react";
import { AuthShell } from "@/features/auth/ui/auth-shell";
import { AuthPageFooter } from "@/features/auth/ui/auth-page-footer";
import { VerifyEmailPoller } from "@/features/auth/ui/verify-email-poller";
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
                Open the email from Registruum and click the verification link. This page will
                automatically detect the confirmation and redirect you to your dashboard.
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

        {email ? <VerifyEmailPoller email={email} next={next} /> : null}
      </div>
    </AuthShell>
  );
}
