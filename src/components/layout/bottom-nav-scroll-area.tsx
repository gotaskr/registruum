"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type BottomNavScrollAreaProps = Readonly<{
  "aria-label": string;
  /** Row inside the scroller: gaps, padding, min-height */
  innerClassName?: string;
  className?: string;
  /** Use `none` when an outer `<nav>` wraps this strip (e.g. back + sections). */
  landmark?: "nav" | "none";
  children: ReactNode;
}>;

/**
 * Constrains width so horizontal swipe/scroll works, and shows edge fades when
 * content extends past the pill (flex row defaults to min-width: max-content).
 */
export function BottomNavScrollArea({
  "aria-label": ariaLabel,
  innerClassName,
  className,
  landmark = "nav",
  children,
}: BottomNavScrollAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const updateOverflowHints = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    const eps = 3;
    setShowLeft(scrollLeft > eps);
    setShowRight(maxScroll > eps && scrollLeft < maxScroll - eps);
  }, []);

  useLayoutEffect(() => {
    const scrollEl = scrollRef.current;
    const innerEl = innerRef.current;
    if (!scrollEl) return;

    updateOverflowHints();
    scrollEl.addEventListener("scroll", updateOverflowHints, { passive: true });
    const ro = new ResizeObserver(updateOverflowHints);
    ro.observe(scrollEl);
    if (innerEl) ro.observe(innerEl);

    return () => {
      scrollEl.removeEventListener("scroll", updateOverflowHints);
      ro.disconnect();
    };
  }, [updateOverflowHints]);

  const Root = landmark === "nav" ? "nav" : "div";
  const rootProps =
    landmark === "nav"
      ? { "aria-label": ariaLabel as string }
      : { "aria-label": ariaLabel as string, role: "group" as const };

  return (
    <Root
      {...rootProps}
      className={cn("relative w-full min-w-0", className)}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 z-10 w-5 bg-gradient-to-r from-white from-30% to-transparent transition-opacity duration-200 dark:from-[#1e293b] sm:w-6",
          showLeft ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 z-10 w-5 bg-gradient-to-l from-white from-30% to-transparent transition-opacity duration-200 dark:from-[#1e293b] sm:w-6",
          showRight ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        ref={scrollRef}
        className={cn(
          "w-full min-w-0 touch-pan-x overflow-x-auto overflow-y-hidden overscroll-x-contain [-webkit-overflow-scrolling:touch]",
          "[scrollbar-width:thin] [scrollbar-color:rgba(100,116,139,0.45)_transparent]",
        )}
      >
        <div
          ref={innerRef}
          className={cn("flex w-max max-w-none items-center justify-start pr-2", innerClassName)}
        >
          {children}
        </div>
      </div>
    </Root>
  );
}
