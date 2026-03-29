import type { ReactNode } from "react";

type AppLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function AppLayout({ children }: AppLayoutProps) {
  return <div className="h-screen min-h-0 overflow-hidden">{children}</div>;
}
