export type BillingPlanTier = "free" | "basic" | "pro_team" | "business" | "enterprise";

export type BillingPlanLimits = Readonly<{
  maxSpaces: number | null;
  /** Non-archived work orders across this owner's spaces; archive one to free a slot (not people on work orders). */
  maxActiveWorkOrders: number | null;
  /** Team members across the owner's spaces (space roster), not work-order assignee count. */
  maxActiveMembers: number | null;
  storageBytes: number | null;
  monthlyBandwidthBytes: number | null;
}>;

export type BillingPlanDefinition = Readonly<{
  tier: BillingPlanTier;
  label: string;
  priceLabel: string;
  trialLabel: string;
  limits: BillingPlanLimits;
}>;

const GB = 1024 * 1024 * 1024;
const TB = 1024 * GB;

/** Tiers exposed in self-serve checkout (Stripe). Excludes `free`. */
export const paidCheckoutPlanTiers = ["basic", "pro_team", "business", "enterprise"] as const;
export type PaidCheckoutPlanTier = (typeof paidCheckoutPlanTiers)[number];

export const billingPlans: Readonly<Record<BillingPlanTier, BillingPlanDefinition>> = {
  free: {
    tier: "free",
    label: "Free",
    priceLabel: "CA$0/month",
    trialLabel: "Always free",
    limits: {
      maxSpaces: 1,
      maxActiveWorkOrders: 5,
      maxActiveMembers: 1,
      storageBytes: 2 * GB,
      monthlyBandwidthBytes: 10 * GB,
    },
  },
  basic: {
    tier: "basic",
    label: "Basic",
    priceLabel: "CA$14.99/month",
    trialLabel: "Billed monthly",
    limits: {
      maxSpaces: 2,
      maxActiveWorkOrders: 20,
      maxActiveMembers: 5,
      storageBytes: 5 * GB,
      monthlyBandwidthBytes: 50 * GB,
    },
  },
  pro_team: {
    tier: "pro_team",
    label: "Pro Team",
    priceLabel: "CA$89.99/month",
    trialLabel: "Billed monthly",
    limits: {
      maxSpaces: 5,
      maxActiveWorkOrders: 50,
      maxActiveMembers: 10,
      storageBytes: 100 * GB,
      monthlyBandwidthBytes: 100 * GB,
    },
  },
  business: {
    tier: "business",
    label: "Business",
    priceLabel: "CA$399.99/month",
    trialLabel: "Billed monthly",
    limits: {
      maxSpaces: 10,
      maxActiveWorkOrders: 100,
      maxActiveMembers: 20,
      storageBytes: 500 * GB,
      monthlyBandwidthBytes: 500 * GB,
    },
  },
  enterprise: {
    tier: "enterprise",
    label: "Enterprise",
    priceLabel: "CA$699.99/month",
    trialLabel: "Billed monthly",
    limits: {
      maxSpaces: 25,
      maxActiveWorkOrders: 300,
      maxActiveMembers: 75,
      storageBytes: TB,
      monthlyBandwidthBytes: TB,
    },
  },
};

export function resolveBillingPlanTier(raw: string | null | undefined): BillingPlanTier {
  if (!raw) {
    return "free";
  }

  if (raw === "basic" || raw === "pro_team" || raw === "business" || raw === "enterprise") {
    return raw;
  }

  return "free";
}
