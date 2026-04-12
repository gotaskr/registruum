import { AuthShell } from "@/features/auth/ui/auth-shell";
import { AuthPageFooter } from "@/features/auth/ui/auth-page-footer";
import { SignUpForm } from "@/features/auth/ui/sign-up-form";
import { AuthTermsNotice } from "@/features/auth/ui/auth-terms-notice";

type SignUpPageProps = Readonly<{
  searchParams: Promise<{
    next?: string;
  }>;
}>;

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const { next } = await searchParams;

  return (
    <AuthShell
      intent="sign-up"
      title="Create your Registruum account"
      description="Create your account to access work orders, spaces, invitations, and structured archive access."
      cardFooter={<AuthTermsNotice mode="sign-up" next={next} />}
      pageFooter={<AuthPageFooter />}
    >
      <SignUpForm next={next} />
    </AuthShell>
  );
}
