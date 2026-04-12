import { AuthShell } from "@/features/auth/ui/auth-shell";
import { AuthPageFooter } from "@/features/auth/ui/auth-page-footer";
import { SignInForm } from "@/features/auth/ui/sign-in-form";
import { AuthTermsNotice } from "@/features/auth/ui/auth-terms-notice";

type SignInPageProps = Readonly<{
  searchParams: Promise<{
    next?: string;
    message?: string;
  }>;
}>;

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { next, message } = await searchParams;

  return (
    <AuthShell
      intent="sign-in"
      title="Sign in to Registruum"
      description="Use your account to access spaces, work orders, and memberships."
      cardFooter={<AuthTermsNotice mode="sign-in" next={next} />}
      pageFooter={<AuthPageFooter />}
    >
      <SignInForm next={next} message={message} />
    </AuthShell>
  );
}
