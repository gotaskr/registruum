import { AuthShell } from "@/features/auth/ui/auth-shell";
import { SignInForm } from "@/features/auth/ui/sign-in-form";

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
      title="Sign in to Registruum"
      description="Use your account to access spaces, work orders, and memberships."
      footer="Use the same email you signed up with. Verified accounts can sign in normally."
    >
      <SignInForm next={next} message={message} />
    </AuthShell>
  );
}
