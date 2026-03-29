import type { ReactNode } from "react";
import { signOut } from "@/features/auth/actions/auth.actions";

type SignOutButtonProps = Readonly<{
  className: string;
  children: ReactNode;
}>;

export function SignOutButton({ className, children }: SignOutButtonProps) {
  return (
    <form action={signOut}>
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}
