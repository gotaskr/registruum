"use client";

import { useEffect, useEffectEvent, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type RealtimeRouteRefreshSubscription = Readonly<{
  table: string;
  filter?: string;
}>;

type RealtimeRouteRefreshProps = Readonly<{
  channelName: string;
  subscriptions: ReadonlyArray<RealtimeRouteRefreshSubscription>;
  debounceMs?: number;
  enabled?: boolean;
}>;

/** Set `NEXT_PUBLIC_REALTIME_ROUTE_REFRESH=false` to skip browser realtime when Supabase is unreachable (avoids dev overlay noise). */
const realtimeRouteRefreshGloballyEnabled =
  process.env.NEXT_PUBLIC_REALTIME_ROUTE_REFRESH !== "false";

export function RealtimeRouteRefresh({
  channelName,
  subscriptions,
  debounceMs = 250,
  enabled = true,
}: RealtimeRouteRefreshProps) {
  const router = useRouter();
  const refreshTimeoutRef = useRef<number | null>(null);
  const subscriptionsKey = useMemo(
    () => JSON.stringify(subscriptions),
    [subscriptions],
  );

  const scheduleRefresh = useEffectEvent(() => {
    if (refreshTimeoutRef.current !== null) {
      window.clearTimeout(refreshTimeoutRef.current);
    }

    refreshTimeoutRef.current = window.setTimeout(() => {
      router.refresh();
    }, debounceMs);
  });

  useEffect(() => {
    if (!enabled || !realtimeRouteRefreshGloballyEnabled) {
      return;
    }

    const parsedSubscriptions = JSON.parse(
      subscriptionsKey,
    ) as RealtimeRouteRefreshSubscription[];

    if (parsedSubscriptions.length === 0) {
      return;
    }

    let supabase: ReturnType<typeof createSupabaseBrowserClient>;
    try {
      supabase = createSupabaseBrowserClient();
    } catch {
      return;
    }

    const channel = supabase.channel(channelName);

    for (const subscription of parsedSubscriptions) {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: subscription.table,
          filter: subscription.filter,
        },
        () => {
          scheduleRefresh();
        },
      );
    }

    let loggedSubscribeIssue = false;
    channel.subscribe((status, err) => {
      if (status === "SUBSCRIBED") {
        return;
      }

      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        // Never call `removeChannel` from inside this callback — Supabase can re-enter it and overflow the stack.
        if (process.env.NODE_ENV === "development" && !loggedSubscribeIssue) {
          loggedSubscribeIssue = true;
          console.warn(
            `[RealtimeRouteRefresh] ${channelName} (${status})`,
            err?.message ?? "",
          );
        }
      }
    });

    return () => {
      if (refreshTimeoutRef.current !== null) {
        window.clearTimeout(refreshTimeoutRef.current);
      }

      void supabase.removeChannel(channel);
    };
  }, [channelName, debounceMs, enabled, scheduleRefresh, subscriptionsKey]);

  return null;
}
