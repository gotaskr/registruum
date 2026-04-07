import { AuthShell } from "@/features/auth/ui/auth-shell";
import { SignUpForm } from "@/features/auth/ui/sign-up-form";

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
      footer="If email verification is enabled, we'll ask you to confirm your email before you can continue."
    >
      <SignUpForm next={next} />
    </AuthShell>
  );
}
