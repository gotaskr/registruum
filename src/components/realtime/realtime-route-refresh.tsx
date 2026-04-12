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
    if (!enabled) {
      return;
    }

    const parsedSubscriptions = JSON.parse(
      subscriptionsKey,
    ) as RealtimeRouteRefreshSubscription[];

    if (parsedSubscriptions.length === 0) {
      return;
    }

    const supabase = createSupabaseBrowserClient();
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

    channel.subscribe();

    return () => {
      if (refreshTimeoutRef.current !== null) {
        window.clearTimeout(refreshTimeoutRef.current);
      }

      void supabase.removeChannel(channel);
    };
  }, [channelName, debounceMs, enabled, scheduleRefresh, subscriptionsKey]);

  return null;
}
