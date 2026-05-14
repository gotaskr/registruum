import "server-only";

import { getStripe } from "@/lib/stripe/server";
import { resolveBillingPlanTierFromStripeSubscription } from "@/features/settings/lib/billing-stripe-tier";
import {
  stripeSubscriptionRetrieveParams,
  subscriptionBillingPayload,
  updateProfileBillingFields,
} from "@/features/settings/api/billing-profile-update";
import { isBillingDisabled } from "@/features/settings/lib/billing-feature-flag";

export type CheckoutBillingSyncResult = "updated" | "skipped" | "forbidden";

/**
 * After Checkout success, Stripe webhooks may be delayed or missing locally.
 * This loads the completed session + subscription and writes `profiles` billing fields.
 */
export async function syncBillingFromStripeCheckoutSession(input: Readonly<{
  sessionId: string;
  userId: string;
  checkoutPlanFromUrl?: string | null;
}>): Promise<CheckoutBillingSyncResult> {
  if (isBillingDisabled() || !process.env.STRIPE_SECRET_KEY?.trim()) {
    return "skipped";
  }

  const stripe = getStripe();

  let session: Awaited<ReturnType<typeof stripe.checkout.sessions.retrieve>>;
  try {
    session = await stripe.checkout.sessions.retrieve(input.sessionId, {
      expand: ["subscription"],
    });
  } catch (cause) {
    console.error("[billing sync] session retrieve failed", cause);
    return "skipped";
  }

  const ref =
    (typeof session.client_reference_id === "string" && session.client_reference_id.trim()
      ? session.client_reference_id.trim()
      : null) ??
    (typeof session.metadata?.supabase_user_id === "string" && session.metadata.supabase_user_id.trim()
      ? session.metadata.supabase_user_id.trim()
      : null);

  if (ref !== input.userId) {
    console.warn("[billing sync] session user mismatch");
    return "forbidden";
  }

  if (session.status !== "complete" || session.mode !== "subscription") {
    return "skipped";
  }

  const subRaw = session.subscription;
  if (!subRaw) {
    return "skipped";
  }

  const subscriptionId = typeof subRaw === "string" ? subRaw : subRaw.id;
  const subscription = await stripe.subscriptions.retrieve(
    subscriptionId,
    stripeSubscriptionRetrieveParams,
  );

  const tier = resolveBillingPlanTierFromStripeSubscription(subscription, {
    sessionMetadataTier: session.metadata?.billing_plan_tier,
    checkoutPlanFromUrl: input.checkoutPlanFromUrl,
  });

  const payload = subscriptionBillingPayload(subscription);

  await updateProfileBillingFields({
    userId: input.userId,
    tier,
    billingStatus: payload.billingStatus,
    trialEndsAtIso: payload.trialEndsAtIso,
    cycleAnchorIso: payload.cycleAnchorIso,
    currentPeriodEndsAtIso: payload.currentPeriodEndsAtIso,
  });

  return "updated";
}
