"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Building2, CheckCircle2, Circle, MapPin, Plus } from "lucide-react";
import Link from "next/link";
import { MainShell } from "@/components/layout/main-shell";
import { RealtimeRouteRefresh } from "@/components/realtime/realtime-route-refresh";
import { getSpaceTypeLabel } from "@/features/spaces/lib/space-types";
import { CreateSpaceModal } from "@/features/spaces/ui/create-space-modal";
import { SpaceAvatar } from "@/features/spaces/ui/space-avatar";
import { getSpaceEntryHref, getWorkOrderModuleHref } from "@/lib/route-utils";
import { formatRoleLabel } from "@/lib/utils";
import type { DashboardOnboardingSnapshot } from "@/features/spaces/api/spaces";
import type { Space } from "@/types/space";

type SpacesDashboardProps = Readonly<{
  profileId: string;
  spaces: Space[];
  onboarding: DashboardOnboardingSnapshot;
}>;

const DEFAULT_MANUAL_STEPS = {
  openedNotifications: false,
  visitedInviteMembersPage: false,
  visitedSettings: false,
  checklistCompleted: false,
} as const;

export function SpacesDashboard({
  profileId,
  spaces,
  onboarding,
}: SpacesDashboardProps) {
  type StepId =
    | "create-space"
    | "create-work-order"
    | "invite-teammate"
    | "open-notifications"
    | "visit-settings";

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const onboardingStorageKey = `registruum-onboarding:${profileId}:phase1`;
  const [manualSteps, setManualSteps] = useState<{
    openedNotifications: boolean;
    visitedInviteMembersPage: boolean;
    visitedSettings: boolean;
    checklistCompleted: boolean;
  }>(DEFAULT_MANUAL_STEPS);
  const [manualStepsLoaded, setManualStepsLoaded] = useState(false);
  const [expandedGuideId, setExpandedGuideId] = useState<string | null>("create-space");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const raw = window.localStorage.getItem(onboardingStorageKey);
        if (!raw) {
          setManualStepsLoaded(true);
          return;
        }
        const parsed = JSON.parse(raw) as Partial<{
          openedNotifications: boolean;
          visitedInviteMembersPage: boolean;
          visitedSettings: boolean;
          checklistCompleted: boolean;
        }>;
        setManualSteps({
          openedNotifications: Boolean(parsed.openedNotifications),
          visitedInviteMembersPage: Boolean(parsed.visitedInviteMembersPage),
          visitedSettings: Boolean(parsed.visitedSettings),
          checklistCompleted: Boolean(parsed.checklistCompleted),
        });
      } catch {
        setManualSteps(DEFAULT_MANUAL_STEPS);
      } finally {
        setManualStepsLoaded(true);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [onboardingStorageKey]);

  useEffect(() => {
    if (!manualStepsLoaded) {
      return;
    }
    window.localStorage.setItem(onboardingStorageKey, JSON.stringify(manualSteps));
  }, [manualSteps, onboardingStorageKey, manualStepsLoaded]);

  const firstSpace = spaces[0] ?? null;
  const inviteMembersHref = onboarding.firstCreatedWorkOrder
    ? getWorkOrderModuleHref(
        onboarding.firstCreatedWorkOrder.spaceId,
        onboarding.firstCreatedWorkOrder.id,
        "members",
      )
    : null;
  const stepOrder: StepId[] = [
    "create-space",
    "create-work-order",
    "invite-teammate",
    "open-notifications",
    "visit-settings",
  ];
  const checklistItems = [
      {
        id: "create-space" as const,
        title: "Create your first space",
        description: "Spaces are your main work areas.",
        teach: {
          what: "A Space is your main workspace for one property, company, or team operation.",
          why: "It keeps members, workorders, and archive records organized in one place.",
          how: "Click Create Space, enter name/type/address, then save. Use clear names (example: North Tower Operations).",
        },
        completed: spaces.length > 0,
      },
      {
        id: "create-work-order" as const,
        title: "Create your first workorder",
        description: "Start your first active project inside a space.",
        teach: {
          what: "A Workorder is an active job/project inside a Space.",
          why: "It gives your team one place for overview, chat, members, documents, and logs.",
          how: "Open a Space, click Create Workorder, fill title/location/details, then use modules to run daily work.",
        },
        completed: onboarding.hasCreatedWorkOrder,
      },
      {
        id: "invite-teammate" as const,
        title: "Invite your first teammate",
        description: "Add teammates from the Workorder Members page.",
        teach: {
          what: "Invites let teammates access your Space and assigned workorders.",
          why: "Without invites, collaborators cannot see your workspace data.",
          how: "Go to Settings > Invitations, enter teammate details, pick role, send invite, and ask them to accept.",
        },
        completed: onboarding.hasSentInvite || manualSteps.visitedInviteMembersPage,
      },
      {
        id: "open-notifications" as const,
        title: "Open notifications",
        description: "Use the bell in the top-right to review invite updates.",
        teach: {
          what: "Notifications show pending invites and account updates that need action.",
          why: "It helps you respond quickly and avoid missing team requests.",
          how: "Click the bell icon in the top-right, review the list, then open invitations/settings links as needed.",
        },
        completed: manualSteps.openedNotifications,
      },
      {
        id: "visit-settings" as const,
        title: "Visit settings",
        description: "Review profile, security, and notification preferences.",
        teach: {
          what: "Settings is where you manage identity, preferences, invitations, and security details.",
          why: "Correct settings improve team communication and account safety.",
          how: "Open Settings, check profile details, notification options, and security/session info.",
        },
        completed: manualSteps.visitedSettings,
      },
    ];
  const completionByStep = new Map(checklistItems.map((item) => [item.id, item.completed]));
  const completedCount = checklistItems.filter((item) => item.completed).length;
  const allCompleted = completedCount === checklistItems.length;

  useEffect(() => {
    if (!allCompleted || manualSteps.checklistCompleted) {
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      setManualSteps((current) => ({
        ...current,
        checklistCompleted: true,
      }));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [allCompleted, manualSteps.checklistCompleted]);

  const hideChecklist = manualSteps.checklistCompleted;
  const checklistPanel = hideChecklist ? null : (
    <aside className="h-fit w-full rounded-2xl border border-border bg-panel p-3 shadow-[0_12px_28px_rgba(15,23,42,0.04)] sm:rounded-[1.5rem] sm:p-4 dark:shadow-none lg:sticky lg:top-[6rem]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
            Getting started
          </p>
          <h2 className="mt-1 text-base font-semibold tracking-tight text-foreground">
            Quick onboarding
          </h2>
          <p className="mt-1 text-xs text-muted">
            {completedCount}/{checklistItems.length} completed
          </p>
        </div>
        {!allCompleted ? (
          <span className="inline-flex rounded-full bg-accent-soft px-2.5 py-1 text-[10px] font-semibold text-accent">
            New
          </span>
        ) : null}
      </div>
      <ul className="mt-3 space-y-2">
        {checklistItems.map((item) => (
          <li key={item.id} className="rounded-xl border border-border bg-panel-muted/45 px-2.5 py-2.5">
            {(() => {
              const stepIndex = stepOrder.indexOf(item.id);
              const unlocked = stepOrder
                .slice(0, stepIndex)
                .every((stepId) => completionByStep.get(stepId));
              const canOpenGuide = unlocked;
              const actionButtonClass =
                "inline-flex h-9 items-center rounded-xl border border-border px-3 text-xs font-semibold transition-colors";
              const primaryClass = `${actionButtonClass} text-foreground hover:bg-panel-muted`;
              const secondaryClass = `${actionButtonClass} text-muted hover:bg-panel-muted`;
              const disabledClass = `${actionButtonClass} cursor-not-allowed text-muted opacity-60`;

              return (
                <>
                  <div className="flex min-w-0 items-start gap-2">
                    {item.completed ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-tight text-foreground">{item.title}</p>
                      <p className="mt-0.5 text-xs text-muted">{item.description}</p>
                    </div>
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    {item.id === "create-space" ? (
                      <button
                        type="button"
                        onClick={() => setIsCreateModalOpen(true)}
                        disabled={!unlocked}
                        className={unlocked ? primaryClass : disabledClass}
                      >
                        Take me there
                      </button>
                    ) : null}
                    {item.id === "create-work-order" ? (
                      firstSpace ? (
                        <Link
                          href={getSpaceEntryHref(firstSpace)}
                          className={unlocked ? primaryClass : disabledClass}
                          onClick={(event) => {
                            if (!unlocked) {
                              event.preventDefault();
                            }
                          }}
                        >
                          Take me there
                        </Link>
                      ) : (
                        <button type="button" disabled className={disabledClass}>
                          Create a space first
                        </button>
                      )
                    ) : null}
                    {item.id === "invite-teammate" ? (
                      inviteMembersHref ? (
                        <Link
                          href={inviteMembersHref}
                          className={unlocked ? primaryClass : disabledClass}
                          onClick={(event) => {
                            if (!unlocked) {
                              event.preventDefault();
                              return;
                            }
                            setManualSteps((current) => ({
                              ...current,
                              visitedInviteMembersPage: true,
                            }));
                          }}
                        >
                          Take me there
                        </Link>
                      ) : (
                        <button type="button" disabled className={disabledClass}>
                          Create a workorder first
                        </button>
                      )
                    ) : null}
                    {item.id === "open-notifications" ? (
                      <button
                        type="button"
                        onClick={() =>
                          setManualSteps((current) => ({ ...current, openedNotifications: true }))
                        }
                        disabled={!unlocked}
                        className={unlocked ? primaryClass : disabledClass}
                      >
                        Mark as done
                      </button>
                    ) : null}
                    {item.id === "visit-settings" ? (
                      <>
                        <Link
                          href="/settings"
                          onClick={(event) => {
                            if (!unlocked) {
                              event.preventDefault();
                              return;
                            }
                            setManualSteps((current) => ({ ...current, visitedSettings: true }));
                          }}
                          className={unlocked ? primaryClass : disabledClass}
                        >
                          Take me there
                        </Link>
                        <button
                          type="button"
                          onClick={() =>
                            setManualSteps((current) => ({ ...current, visitedSettings: true }))
                          }
                          disabled={!unlocked}
                          className={unlocked ? secondaryClass : disabledClass}
                        >
                          Mark as done
                        </button>
                      </>
                    ) : null}
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedGuideId((current) => (current === item.id ? null : item.id))
                      }
                      disabled={!canOpenGuide}
                      className={canOpenGuide ? secondaryClass : disabledClass}
                    >
                      {expandedGuideId === item.id ? "Hide guide" : "Learn"}
                    </button>
                  </div>
                  {!unlocked ? (
                    <p className="mt-2 text-[11px] font-medium text-muted">
                      Complete the previous step to unlock this guide.
                    </p>
                  ) : null}
                  {expandedGuideId === item.id && unlocked ? (
                    <div className="mt-2.5 rounded-lg border border-border bg-panel px-2.5 py-2">
                      <p className="text-[11px] text-muted">
                        <span className="font-semibold text-foreground">What:</span>{" "}
                        {item.teach.what}
                      </p>
                      <p className="mt-1 text-[11px] text-muted">
                        <span className="font-semibold text-foreground">Why:</span>{" "}
                        {item.teach.why}
                      </p>
                      <p className="mt-1 text-[11px] text-muted">
                        <span className="font-semibold text-foreground">How:</span>{" "}
                        {item.teach.how}
                      </p>
                    </div>
                  ) : null}
                </>
              );
            })()}
          </li>
        ))}
      </ul>
    </aside>
  );

  return (
    <>
      <RealtimeRouteRefresh
        channelName="dashboard:spaces"
        subscriptions={[
          { table: "spaces" },
          { table: "space_memberships" },
          { table: "work_order_memberships" },
          { table: "invites" },
        ]}
      />
      <MainShell
        title="Active Spaces"
        description="Browse the organizations you belong to and jump into their active work."
        actions={
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(31,95,255,0.24)] dark:shadow-none sm:h-11 lg:w-auto"
          >
            <Plus className="h-4 w-4" />
            Create Space
          </button>
        }
      >
        {spaces.length === 0 ? (
          <section className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
            <div className={`mx-auto grid max-w-6xl gap-4 ${hideChecklist ? "" : "lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start"}`}>
              <div className="grid place-items-center px-2 py-6 sm:py-10">
                <div className="w-full max-w-md text-center sm:max-w-2xl">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.75rem] bg-accent-soft text-accent">
                    <Building2 className="h-7 w-7" />
                  </div>
                  <h2 className="mt-6 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                    Start with your first space
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                    Spaces are your top-level organizations. Once you create one, you can add workorders, invite your team, and manage a dedicated archive.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="mt-8 inline-flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(31,95,255,0.24)] dark:shadow-none sm:h-11 sm:w-auto sm:max-w-none"
                  >
                    <Plus className="h-4 w-4" />
                    Create Space
                  </button>
                </div>
              </div>
              {checklistPanel}
            </div>
          </section>
        ) : (
          <section className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
            <div className={`mx-auto grid max-w-6xl gap-4 ${hideChecklist ? "" : "lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start"}`}>
              <div className="grid gap-4 sm:gap-5 xl:grid-cols-2">
                {spaces.map((space) => (
                  <Link
                    key={space.id}
                    href={getSpaceEntryHref(space)}
                    className="group flex flex-col rounded-2xl border border-border bg-panel p-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)] transition-[transform,box-shadow] active:scale-[0.99] sm:rounded-[2rem] sm:p-6 sm:hover:-translate-y-0.5 sm:hover:shadow-[0_22px_44px_rgba(15,23,42,0.08)] dark:shadow-none dark:sm:hover:shadow-none"
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <SpaceAvatar
                        name={space.name}
                        photoUrl={space.photoUrl}
                        className="h-14 w-14 shrink-0 rounded-[1.25rem] sm:h-16 sm:w-16 sm:rounded-[1.5rem]"
                        fallbackClassName="border border-border"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
                          Space
                        </p>
                        <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-foreground sm:mt-3 sm:text-2xl">
                          {space.name}
                        </h2>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {space.spaceType ? (
                            <span className="inline-flex rounded-full bg-panel-muted px-3 py-1 text-xs font-semibold text-muted">
                              {getSpaceTypeLabel(space.spaceType)}
                            </span>
                          ) : null}
                          <span className="inline-flex rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
                            {space.membershipRole
                              ? formatRoleLabel(space.membershipRole)
                              : "Assigned"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {space.address ? (
                      <div className="mt-4 flex items-start gap-2 rounded-xl bg-panel-muted px-3 py-2 text-sm text-muted sm:mt-5 sm:inline-flex sm:items-center sm:rounded-full sm:py-1.5">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted sm:mt-0" />
                        <span className="min-w-0 leading-snug">{space.address}</span>
                      </div>
                    ) : null}

                    <div className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-accent-soft py-3 text-sm font-semibold text-accent transition-colors group-hover:bg-accent group-hover:text-white sm:mt-6 sm:w-auto sm:justify-start sm:bg-transparent sm:py-0 sm:text-accent sm:group-hover:bg-transparent sm:group-hover:text-accent">
                      Open space
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                ))}
              </div>
              {checklistPanel}
            </div>
          </section>
        )}
      </MainShell>

      <CreateSpaceModal
        key={isCreateModalOpen ? "create-space-open" : "create-space-closed"}
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
}
