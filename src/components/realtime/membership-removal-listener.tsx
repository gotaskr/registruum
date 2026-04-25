"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import {
  clearActiveWorkOrderPresence,
  isTerminalWorkOrderStatus,
  readActiveWorkOrderPresence,
} from "@/lib/client/active-work-order-presence-storage";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

const realtimeGloballyEnabled =
  process.env.NEXT_PUBLIC_REALTIME_ROUTE_REFRESH !== "false";

type RemovalNotice = Readonly<{
  title: string;
  description: string;
}>;

function parseSegment(pathname: string, segment: "space" | "work-order") {
  const re =
    segment === "space"
      ? /\/space\/([^/]+)/
      : /\/work-order\/([^/]+)/;
  const match = pathname.match(re);
  return match?.[1] ?? null;
}

export function MembershipRemovalListener() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const pathnameRef = useRef(pathname);
  const routerRef = useRef(router);

  const [notice, setNotice] = useState<RemovalNotice | null>(null);

  const spaceRemovalAtRef = useRef(0);
  const refreshTimeoutRef = useRef<number | null>(null);
  const modalTimeoutRef = useRef<number | null>(null);
  const pendingWoRemovalRef = useRef<string | null>(null);
  const membershipChannelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    pathnameRef.current = pathname;
    routerRef.current = router;
    if (!pathname.includes("/work-order/")) {
      clearActiveWorkOrderPresence();
    }
  }, [pathname, router]);

  useEffect(() => {
    if (!realtimeGloballyEnabled) {
      return;
    }

    let supabase: ReturnType<typeof createSupabaseBrowserClient>;
    try {
      supabase = createSupabaseBrowserClient();
    } catch {
      return;
    }

    let cancelled = false;

    const scheduleRefresh = () => {
      if (refreshTimeoutRef.current !== null) {
        window.clearTimeout(refreshTimeoutRef.current);
      }
      refreshTimeoutRef.current = window.setTimeout(() => {
        routerRef.current.refresh();
      }, 250);
    };

    const flushPendingWoRemoval = () => {
      const workOrderId = pendingWoRemovalRef.current;
      pendingWoRemovalRef.current = null;
      if (!workOrderId) {
        return;
      }

      const path = pathnameRef.current;
      const presence = readActiveWorkOrderPresence();
      const onThisWorkOrder = parseSegment(path, "work-order") === workOrderId;
      const knownTerminal =
        presence?.workOrderId === workOrderId &&
        isTerminalWorkOrderStatus(presence.status);

      if (knownTerminal) {
        if (onThisWorkOrder) {
          routerRef.current.replace("/");
        }
        return;
      }

      setNotice({
        title: "Removed from work order",
        description:
          "Your access to this work order was removed. You have been returned to your dashboard.",
      });

      if (onThisWorkOrder) {
        routerRef.current.replace("/");
      }
    };

    const scheduleWoRemovalModal = () => {
      if (modalTimeoutRef.current !== null) {
        window.clearTimeout(modalTimeoutRef.current);
      }
      modalTimeoutRef.current = window.setTimeout(() => {
        flushPendingWoRemoval();
        modalTimeoutRef.current = null;
      }, 320);
    };

    void (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error || cancelled) {
          return;
        }

        const userId = data.session?.user.id;
        if (!userId) {
          return;
        }

        const filter = `user_id=eq.${userId}`;
        const channel = supabase.channel(`membership-removal:${userId}`);
        membershipChannelRef.current = channel;

        channel.on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "work_order_memberships",
            filter,
          },
          (payload) => {
            const oldRow = payload.old as { work_order_id?: string } | null;
            const workOrderId = oldRow?.work_order_id;
            if (!workOrderId) {
              return;
            }

            scheduleRefresh();

            if (Date.now() - spaceRemovalAtRef.current < 2800) {
              return;
            }

            pendingWoRemovalRef.current = workOrderId;
            scheduleWoRemovalModal();
          },
        );

        channel.on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "space_memberships",
            filter,
          },
          (payload) => {
            const next = payload.new as { status?: string; space_id?: string } | null;
            const prev = payload.old as { status?: string } | null;
            if (!next?.space_id || next.status !== "removed") {
              return;
            }
            if (prev?.status === "removed") {
              return;
            }

            scheduleRefresh();
            spaceRemovalAtRef.current = Date.now();

            setNotice({
              title: "Removed from space",
              description:
                "Your membership in this space was removed. Spaces and work orders from that space will disappear from your dashboard.",
            });

            const onSpace = parseSegment(pathnameRef.current, "space") === next.space_id;
            if (onSpace) {
              routerRef.current.replace("/");
            }
          },
        );

        if (cancelled) {
          void supabase.removeChannel(channel);
          membershipChannelRef.current = null;
          return;
        }

        channel.subscribe((status, err) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            if (process.env.NODE_ENV === "development") {
              console.warn("[MembershipRemovalListener]", status, err?.message ?? "");
            }
          }
        });
      } catch (cause) {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "[MembershipRemovalListener] Supabase unreachable; membership realtime disabled.",
            cause,
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      if (refreshTimeoutRef.current !== null) {
        window.clearTimeout(refreshTimeoutRef.current);
      }
      if (modalTimeoutRef.current !== null) {
        window.clearTimeout(modalTimeoutRef.current);
      }
      const ch = membershipChannelRef.current;
      membershipChannelRef.current = null;
      if (ch) {
        void supabase.removeChannel(ch);
      }
    };
  }, []);

  return (
    <Modal
      open={notice !== null}
      title={notice?.title ?? ""}
      description={notice?.description}
      onClose={() => setNotice(null)}
      bottomSheetOnNarrow
    >
      <div className="px-5 pb-5 pt-2">
        <Button
          variant="brand"
          className="w-full"
          onClick={() => setNotice(null)}
        >
          Continue
        </Button>
      </div>
    </Modal>
  );
}
