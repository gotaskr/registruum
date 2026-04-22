import type { ReactNode } from "react";
import { MembershipRemovalListener } from "@/components/realtime/membership-removal-listener";

type AppLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="h-screen min-h-0 overflow-hidden">
      <MembershipRemovalListener />
      {children}
    </div>
  );
}
