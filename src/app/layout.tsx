import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import {
  resolveThemePreference,
  themeCookieName,
} from "@/features/settings/lib/preferences";
import "./globals.css";

export const metadata: Metadata = {
  title: "Registruum",
  description: "Operational workspace for spaces, work orders, and documents.",
  manifest: "/manifest.webmanifest",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default async function RootLayout({ children }: RootLayoutProps) {
  const cookieStore = await cookies();
  const theme = resolveThemePreference(cookieStore.get(themeCookieName)?.value);

  return (
    <html lang="en" data-theme={theme} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
