"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  getVisibleSettingsSections,
  settingsSections,
  type SettingsSectionId,
} from "@/features/settings/lib/settings-sections";

function getActiveSection(value: string | null): SettingsSectionId {
  const normalized = value as SettingsSectionId | null;

  if (normalized && settingsSections.some((section) => section.id === normalized)) {
    return normalized;
  }

  return "profile";
}

type SettingsSidebarProps = Readonly<{
  canManagePassword: boolean;
}>;

export function SettingsSidebar({
  canManagePassword,
}: SettingsSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const visibleSections = getVisibleSettingsSections(canManagePassword);
  const activeSection = getActiveSection(searchParams.get("section"));
  const resolvedActiveSection = visibleSections.some((section) => section.id === activeSection)
    ? activeSection
    : visibleSections[0]?.id ?? "profile";

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_1fr]">
      <div className="border-b border-border px-4 py-5">
        <h1 className="text-[15px] font-semibold text-foreground">Settings</h1>
        <p className="mt-2 text-sm text-muted">
          Account controls and workspace preferences.
        </p>
      </div>

      <nav className="min-h-0 overflow-hidden px-3 py-4">
        <div className="space-y-1">
          {visibleSections.map((section) => {
            const Icon = section.icon;

            return (
              <Link
                key={section.id}
                href={`${pathname}?section=${section.id}`}
                scroll={false}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  resolvedActiveSection === section.id
                    ? "bg-panel-muted text-foreground"
                    : "text-muted hover:bg-panel-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{section.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
