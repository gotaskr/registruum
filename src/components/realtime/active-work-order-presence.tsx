"use client";

import { useEffect } from "react";
import {
  clearActiveWorkOrderPresence,
  setActiveWorkOrderPresence,
} from "@/lib/client/active-work-order-presence-storage";

type ActiveWorkOrderPresenceProps = Readonly<{
  spaceId: string;
  workOrderId: string;
  status: string;
}>;

export function ActiveWorkOrderPresence({
  spaceId,
  workOrderId,
  status,
}: ActiveWorkOrderPresenceProps) {
  useEffect(() => {
    setActiveWorkOrderPresence({ spaceId, workOrderId, status });
    return () => {
      clearActiveWorkOrderPresence();
    };
  }, [spaceId, workOrderId, status]);

  return null;
}
