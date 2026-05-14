import type { BillingPlanTier } from "@/features/settings/lib/subscription-plans";

export type BillingSnapshot = Readonly<{
  planTier: BillingPlanTier;
  planLabel: string;
  billingCycle: "monthly";
  renewalDateLabel: string;
  usage: Readonly<{
    usedStorageLabel: string;
    storagePercent: number;
    activeMembersLabel: string;
    membersPercent: number;
    usedBandwidthLabel: string;
    bandwidthPercent: number;
    activeWorkOrdersLabel: string;
  }>;
}>;
