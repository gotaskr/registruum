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

function getSectionHelperText(sectionId: SettingsSectionId) {
  if (sectionId === "profile") {
    return "Identity and company presence";
  }

  if (sectionId === "invitations") {
    return "Pending invites and access requests";
  }

  if (sectionId === "security") {
    return "Password and account protection";
  }

  if (sectionId === "preferences") {
    return "Theme, landing page, and format";
  }

  if (sectionId === "notifications") {
    return "In-app and email delivery";
  }

  if (sectionId === "subscription") {
    return "Plans, billing, and invoices";
  }

  return "Device and session activity";
}

export function SettingsSidebar({
  canManagePassword,
}: SettingsSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const visibleSections = getVisibleSettingsSections(canManagePassword);
  const activeSection = getActiveSection(searchParams.get("section"));
  const resolvedActiveSection = visibleSections.some((section) => section.id === activeSection)
    ? activeSection
    : null;

  return (
    <div className="grid min-w-0 content-start gap-4 py-1">
      <div className="min-w-0 overflow-hidden rounded-[1.75rem] border border-border bg-panel px-4 py-4 shadow-[0_14px_28px_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
              Settings
            </p>
            <h1 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
              {visibleSections.find((section) => section.id === resolvedActiveSection)?.label ?? "Profile"}
            </h1>
          </div>
          <div className="rounded-full bg-accent-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
            Active
          </div>
        </div>
      </div>

      <nav className="min-w-0 overflow-hidden rounded-[2rem] border border-border bg-panel p-3 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
        <div className="space-y-2">
          {visibleSections.map((section) => {
            const Icon = section.icon;
            const isActive = resolvedActiveSection === section.id;

            return (
              <Link
                key={section.id}
                href={`${pathname}?section=${section.id}`}
                scroll={false}
                className={cn(
                  "group flex min-w-0 items-center gap-3 overflow-hidden rounded-[1.4rem] border px-3 py-3.5 text-sm transition-all",
                  isActive
                    ? "border-border-strong bg-accent-soft text-foreground shadow-[0_10px_22px_rgba(47,95,212,0.08)]"
                    : "border-transparent text-muted hover:border-border hover:bg-panel-muted hover:text-foreground",
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-colors",
                    isActive
                      ? "border-border bg-panel text-accent"
                      : "border-border bg-panel-muted text-muted group-hover:border-border-strong group-hover:text-accent",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-medium">{section.label}</p>
                  <p className="mt-0.5 max-w-full truncate text-xs text-muted">
                    {getSectionHelperText(section.id)}
                  </p>
                </div>

                <span
                  className={cn(
                    "text-base transition-transform",
                    isActive ? "text-accent" : "text-muted group-hover:translate-x-0.5",
                  )}
                >
                  ›
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
