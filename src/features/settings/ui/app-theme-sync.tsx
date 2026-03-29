"use client";

import { useEffect } from "react";
import type { ThemePreference } from "@/features/settings/lib/preferences";

type AppThemeSyncProps = Readonly<{
  theme: ThemePreference;
}>;

export function AppThemeSync({
  theme,
}: AppThemeSyncProps) {
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return null;
}
