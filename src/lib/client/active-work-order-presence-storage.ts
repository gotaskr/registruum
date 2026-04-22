"use client";

export const ACTIVE_WORK_ORDER_PRESENCE_KEY = "registruum:wo-presence";

export type ActiveWorkOrderPresencePayload = Readonly<{
  spaceId: string;
  workOrderId: string;
  status: string;
}>;

export function setActiveWorkOrderPresence(
  payload: ActiveWorkOrderPresencePayload,
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      ACTIVE_WORK_ORDER_PRESENCE_KEY,
      JSON.stringify(payload),
    );
  } catch {
    // ignore quota / private mode
  }
}

export function clearActiveWorkOrderPresence() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(ACTIVE_WORK_ORDER_PRESENCE_KEY);
  } catch {
    // ignore
  }
}

export function readActiveWorkOrderPresence(): ActiveWorkOrderPresencePayload | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(ACTIVE_WORK_ORDER_PRESENCE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<ActiveWorkOrderPresencePayload>;
    if (
      typeof parsed.spaceId !== "string" ||
      typeof parsed.workOrderId !== "string" ||
      typeof parsed.status !== "string"
    ) {
      return null;
    }

    return {
      spaceId: parsed.spaceId,
      workOrderId: parsed.workOrderId,
      status: parsed.status,
    };
  } catch {
    return null;
  }
}

export function isTerminalWorkOrderStatus(status: string): boolean {
  return status === "completed" || status === "archived";
}
