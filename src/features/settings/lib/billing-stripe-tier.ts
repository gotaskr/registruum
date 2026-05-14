import type Stripe from "stripe";
import {
  resolveBillingPlanTier,
  type BillingPlanTier,
} from "@/features/settings/lib/subscription-plans";
import { resolveBillingTierFromStripePriceId } from "@/lib/stripe/price-ids";

/**
 * Resolves the app plan tier from Stripe subscription + optional hints.
 * Order: subscription metadata → session metadata → checkout URL hint → Stripe price id.
 */
export function resolveBillingPlanTierFromStripeSubscription(
  subscription: Stripe.Subscription,
  options?: Readonly<{
    sessionMetadataTier?: string | null;
    checkoutPlanFromUrl?: string | null;
  }>,
): BillingPlanTier {
  const fromSubMeta = resolveBillingPlanTier(subscription.metadata?.billing_plan_tier);
  if (fromSubMeta !== "free") {
    return fromSubMeta;
  }

  const fromSession = resolveBillingPlanTier(options?.sessionMetadataTier);
  if (fromSession !== "free") {
    return fromSession;
  }

  const urlHint = options?.checkoutPlanFromUrl?.trim();
  if (urlHint) {
    const fromUrl = resolveBillingPlanTier(urlHint);
    if (fromUrl !== "free") {
      return fromUrl;
    }
  }

  const item = subscription.items?.data?.[0];
  const priceId =
    typeof item?.price === "string"
      ? item.price
      : item?.price && typeof item.price === "object" && "id" in item.price && typeof item.price.id === "string"
        ? item.price.id
        : null;

  return resolveBillingTierFromStripePriceId(priceId) ?? "free";
}
