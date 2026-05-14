"use server";

import {
  getBandwidthPlanLimitBlock,
  getDocumentStorageUploadPlanLimitBlock,
} from "@/features/settings/lib/subscription-enforcement";
import type { UpgradePrompt } from "@/features/settings/types/upgrade-prompt";

export type WorkOrderAttachmentPlanCheckResult =
  | { ok: true }
  | { ok: false; message: string; upgradePrompt: UpgradePrompt };

/**
 * Client-callable gate before uploading chat attachments (browser upload path).
 */
export async function checkWorkOrderAttachmentPlanLimits(input: {
  spaceId: string;
  additionalBytes: number;
  userId: string;
}): Promise<WorkOrderAttachmentPlanCheckResult> {
  if (input.additionalBytes <= 0) {
    return { ok: true };
  }

  const storage = await getDocumentStorageUploadPlanLimitBlock(
    input.spaceId,
    input.additionalBytes,
    input.userId,
  );
  if (storage) {
    return { ok: false, message: storage.message, upgradePrompt: storage.upgradePrompt };
  }

  const bandwidth = await getBandwidthPlanLimitBlock(input.spaceId);
  if (bandwidth) {
    return { ok: false, message: bandwidth.message, upgradePrompt: bandwidth.upgradePrompt };
  }

  return { ok: true };
}
