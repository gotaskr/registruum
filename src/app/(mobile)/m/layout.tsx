import type { ReactNode } from "react";

type MobileRouteLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function MobileRouteLayout({ children }: MobileRouteLayoutProps) {
  return <div className="min-h-screen bg-[linear-gradient(180deg,#edf3fa_0%,#f7f9fc_100%)]">{children}</div>;
}
