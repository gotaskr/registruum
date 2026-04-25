"use client";

import { createPortal } from "react-dom";
import {
  startTransition,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { canCreateWorkOrder } from "@/features/permissions/lib/work-order-permissions";
import {
  canAccessSpaceArchive,
  canAccessSpaceSettings,
  canAccessSpaceTeam,
} from "@/features/permissions/lib/roles";
import { getSpaceWorkOrdersHref } from "@/lib/route-utils";
import type { Space } from "@/types/space";

type TourStep = Readonly<{
  id: string;
  title: string;
  body: string;
}>;

type TourState = Readonly<{
  completed: boolean;
  step: number;
}>;

function readTourState(storageKey: string): TourState {
  if (typeof window === "undefined") {
    return { completed: false, step: 0 };
  }
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return { completed: false, step: 0 };
    }
    const parsed = JSON.parse(raw) as Partial<TourState>;
    return {
      completed: Boolean(parsed.completed),
      step: typeof parsed.step === "number" && parsed.step >= 0 ? parsed.step : 0,
    };
  } catch {
    return { completed: false, step: 0 };
  }
}

function writeTourState(storageKey: string, state: TourState) {
  window.localStorage.setItem(storageKey, JSON.stringify(state));
}

function isInsideSpaceWorkOrderRoute(pathname: string, spaceId: string) {
  return pathname.startsWith(`/space/${spaceId}/work-order/`);
}

function findVisibleTourTarget(tourId: string): HTMLElement | null {
  const nodes = document.querySelectorAll<HTMLElement>(`[data-space-tour="${tourId}"]`);
  for (const node of nodes) {
    const rect = node.getBoundingClientRect();
    if (rect.width >= 8 && rect.height >= 8) {
      return node;
    }
  }
  return null;
}

export function SpaceFirstVisitTour({
  profileId,
  space,
}: Readonly<{
  profileId: string;
  space: Space;
}>) {
  const pathname = usePathname();
  const storageKey = `registruum-space-tour:v1:${profileId}:${space.id}`;
  const workOrdersHref = getSpaceWorkOrdersHref(space.id);
  const isWorkOrdersList =
    pathname === workOrdersHref || pathname === `${workOrdersHref}/`;
  const canCreate = canCreateWorkOrder(space.membershipRole ?? null);

  const steps = useMemo((): TourStep[] => {
    const list: TourStep[] = [
      {
        id: "space-profile",
        title: "Your space at a glance",
        body: "This card is your space identity: name, type, and address help everyone recognize which site or organization you are working in.",
      },
      {
        id: "space-nav-workorders",
        title: "Workorders",
        body: "All active jobs and projects for this space live under Workorders. Open one to collaborate using overview, chat, members, documents, and logs.",
      },
    ];

    if (canAccessSpaceTeam(space.membershipRole)) {
      list.push({
        id: "space-nav-team",
        title: "Team",
        body: "Team lists everyone who belongs to this space and their roles. Use it to see who can help on workorders and who manages access.",
      });
    }

    if (canAccessSpaceArchive(space.membershipRole)) {
      list.push({
        id: "space-nav-archive",
        title: "Archive",
        body: "Archive holds completed or stored work for this space. Use it when you need historical records without cluttering active work.",
      });
    }

    if (canAccessSpaceSettings(space.membershipRole)) {
      list.push({
        id: "space-nav-settings",
        title: "Space settings",
        body: "Configure how this space behaves for your team: metadata, access, and other space-level options live here.",
      });
    }

    if (isWorkOrdersList && canCreate) {
      list.push({
        id: "space-create-workorder",
        title: "Create a workorder",
        body: "Start a new job or inspection here. Each workorder becomes a shared hub for status, files, messages, and activity for that project.",
      });
    }

    return list;
  }, [canCreate, isWorkOrdersList, space.membershipRole]);

  const [tourOpen, setTourOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const didHydrateStepRef = useRef(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      startTransition(() => {
        if (isInsideSpaceWorkOrderRoute(pathname, space.id)) {
          setTourOpen(false);
          return;
        }
        const state = readTourState(storageKey);
        if (state.completed) {
          setTourOpen(false);
          return;
        }
        setTourOpen(true);
        if (!didHydrateStepRef.current) {
          didHydrateStepRef.current = true;
          setStepIndex(Math.min(state.step, Math.max(0, steps.length - 1)));
        }
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname, space.id, storageKey, steps.length]);

  const maxStepIndex = Math.max(0, steps.length - 1);
  const safeStepIndex = Math.min(Math.max(0, stepIndex), maxStepIndex);
  const currentStep = steps[safeStepIndex] ?? null;

  const updateTargetRect = useCallback(() => {
    if (!currentStep || typeof document === "undefined") {
      setTargetRect(null);
      return;
    }
    const el = findVisibleTourTarget(currentStep.id);
    if (!el) {
      setTargetRect(null);
      return;
    }
    setTargetRect(el.getBoundingClientRect());
  }, [currentStep]);

  useLayoutEffect(() => {
    if (!tourOpen || !currentStep) {
      return;
    }

    let frame = 0;
    const run = () => {
      updateTargetRect();
      frame = window.requestAnimationFrame(() => {
        updateTargetRect();
      });
    };

    run();
    window.addEventListener("resize", updateTargetRect);
    window.addEventListener("scroll", updateTargetRect, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateTargetRect);
      window.removeEventListener("scroll", updateTargetRect, true);
    };
  }, [currentStep, tourOpen, updateTargetRect, pathname, stepIndex]);

  const goNext = useCallback(() => {
    setStepIndex((prev) => {
      const max = Math.max(0, steps.length - 1);
      const cur = Math.min(Math.max(0, prev), max);
      const next = cur + 1;
      if (next >= steps.length) {
        writeTourState(storageKey, { completed: true, step: steps.length });
        window.requestAnimationFrame(() => {
          startTransition(() => {
            setTourOpen(false);
          });
        });
        return cur;
      }
      writeTourState(storageKey, { completed: false, step: next });
      return next;
    });
  }, [steps.length, storageKey]);

  const skipTour = useCallback(() => {
    writeTourState(storageKey, { completed: true, step: safeStepIndex });
    window.requestAnimationFrame(() => {
      startTransition(() => {
        setTourOpen(false);
      });
    });
  }, [safeStepIndex, storageKey]);

  useEffect(() => {
    if (!tourOpen || !currentStep) {
      return;
    }
    const el = findVisibleTourTarget(currentStep.id);
    if (el) {
      el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    }
  }, [currentStep, tourOpen, stepIndex]);

  useEffect(() => {
    if (!tourOpen || !currentStep) {
      return;
    }
    const timeout = window.setTimeout(() => {
      const el = findVisibleTourTarget(currentStep.id);
      if (!el && safeStepIndex < steps.length - 1) {
        goNext();
      }
    }, 160);
    return () => window.clearTimeout(timeout);
  }, [currentStep, goNext, safeStepIndex, steps.length, tourOpen]);

  if (typeof document === "undefined" || !tourOpen || !currentStep) {
    return null;
  }

  const bubbleMaxWidth = 280;
  const padding = 12;
  const viewportW = typeof window !== "undefined" ? window.innerWidth : 0;
  const viewportH = typeof window !== "undefined" ? window.innerHeight : 0;

  let bubbleTop = padding;
  let bubbleLeft = padding;

  if (targetRect) {
    const fitsRight = targetRect.right + padding + bubbleMaxWidth <= viewportW;
    const fitsLeft = targetRect.left - padding - bubbleMaxWidth >= 0;

    if (fitsRight) {
      bubbleLeft = Math.min(targetRect.right + padding, viewportW - bubbleMaxWidth - padding);
      bubbleTop = Math.min(
        Math.max(padding, targetRect.top + targetRect.height / 2 - 72),
        viewportH - 200,
      );
    } else if (fitsLeft) {
      bubbleLeft = Math.max(padding, targetRect.left - bubbleMaxWidth - padding);
      bubbleTop = Math.min(
        Math.max(padding, targetRect.top + targetRect.height / 2 - 72),
        viewportH - 200,
      );
    } else {
      bubbleLeft = Math.max(
        padding,
        Math.min(targetRect.left, viewportW - bubbleMaxWidth - padding),
      );
      bubbleTop = Math.min(targetRect.bottom + padding, viewportH - 220);
    }
  }

  return createPortal(
    <div className="pointer-events-auto fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-labelledby="space-tour-title">
      {targetRect ? (
        <div
          className="pointer-events-none absolute rounded-2xl border-2 border-accent shadow-[0_0_0_6px_rgba(31,95,255,0.12)]"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />
      ) : null}
      <div
        className="absolute z-[101] w-[min(calc(100vw-2rem),280px)] rounded-2xl border border-border bg-panel p-4 shadow-[0_20px_50px_rgba(15,23,42,0.18)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
        style={{ top: bubbleTop, left: bubbleLeft }}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
              Space tour
            </p>
            <h2 id="space-tour-title" className="mt-1 text-base font-semibold text-foreground">
              {currentStep.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={skipTour}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-panel-muted hover:text-foreground"
            aria-label="Close tour"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted">{currentStep.body}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="text-xs text-muted">
            {safeStepIndex + 1} / {steps.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={skipTour}
              className="inline-flex h-9 items-center rounded-xl px-3 text-xs font-semibold text-muted transition-colors hover:bg-panel-muted"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={goNext}
              className="inline-flex h-9 items-center rounded-xl bg-accent px-4 text-xs font-semibold text-white shadow-[0_10px_24px_rgba(31,95,255,0.25)] dark:shadow-none"
            >
              {safeStepIndex >= steps.length - 1 ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
