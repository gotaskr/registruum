import type { BillingPlanTier } from "@/features/settings/lib/subscription-plans";

export function parseCheckoutPlan(raw: string | null): BillingPlanTier {
  if (raw === "basic" || raw === "pro_team" || raw === "business" || raw === "enterprise") {
    return raw;
  }

  return "basic";
}

export function resolveStripePriceIdForTier(tier: BillingPlanTier): string | null {
  if (tier === "free") {
    return null;
  }

  const map = {
    basic: process.env.STRIPE_PRICE_ID_BASIC,
    pro_team: process.env.STRIPE_PRICE_ID_PRO_TEAM,
    business: process.env.STRIPE_PRICE_ID_BUSINESS,
    enterprise: process.env.STRIPE_PRICE_ID_ENTERPRISE,
  } satisfies Record<Exclude<BillingPlanTier, "free">, string | undefined>;

  return map[tier] ?? null;
}

export function hasMinimumStripeCheckoutConfig(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID_BASIC);
}
