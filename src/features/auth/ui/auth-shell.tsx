import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = Readonly<{
  title: string;
  description: string;
  footer: ReactNode;
  children: ReactNode;
}>;

export function AuthShell({
  title,
  description,
  footer,
  children,
}: AuthShellProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[28rem_minmax(0,1fr)]">
      <div className="flex items-center border-b border-border bg-panel px-6 py-10 lg:border-r lg:border-b-0 lg:px-10">
        <div className="w-full max-w-sm space-y-6">
          <Link href="/" className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#4d8dff] text-base font-semibold text-white">
            R
          </Link>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
            <p className="text-sm text-muted">{description}</p>
          </div>
          {children}
          <div className="text-sm text-muted">{footer}</div>
        </div>
      </div>
      <div className="hidden bg-[#f7f9fc] lg:block" />
    </div>
  );
}
