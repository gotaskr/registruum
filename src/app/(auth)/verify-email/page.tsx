import Link from "next/link";
import { AuthShell } from "@/features/auth/ui/auth-shell";

type VerifyEmailPageProps = Readonly<{
  searchParams: Promise<{
    email?: string;
  }>;
}>;

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const { email } = await searchParams;

  return (
    <AuthShell
      title="Verify your email"
      description="This screen is kept for future hosted environments that require email confirmation."
      footer={
        <>
          In local development, you can go straight to{" "}
          <Link href="/sign-in" className="font-medium text-foreground">
            sign in
          </Link>
          .
        </>
      }
    >
      <div className="space-y-4 rounded-lg border border-border bg-panel-muted p-4 text-sm text-muted">
        <p>
          Hosted environments can send a confirmation email to{" "}
          <span className="font-medium text-foreground">{email ?? "your inbox"}</span>.
        </p>
        <p>For local Supabase, email confirmation is currently disabled.</p>
      </div>
    </AuthShell>
  );
}
