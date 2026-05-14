"use server";

import { requireAuthenticatedAppUser } from "@/features/auth/api/profiles";
import { getPlanStorageBreakdownForUser } from "@/features/settings/lib/plan-storage-usage";
import type { PlanStorageBreakdownItem } from "@/features/settings/types/plan-storage-breakdown";

export async function loadPlanStorageBreakdown(): Promise<PlanStorageBreakdownItem[]> {
  const { user } = await requireAuthenticatedAppUser();
  return getPlanStorageBreakdownForUser(user.id);
}
