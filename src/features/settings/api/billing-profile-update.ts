import "server-only";

import type Stripe from "stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isBillingDisabled } from "@/features/settings/lib/billing-feature-flag";
import type { BillingPlanTier } from "@/features/settings/lib/subscription-plans";
import { getStripe } from "@/lib/stripe/server";

/**
 * Webhook payloads and some retrieves can omit nested `items`; period bounds live on
 * each item. Expanding ensures {@link resolveSubscriptionCurrentPeriodEndSeconds} works.
 */
export const stripeSubscriptionRetrieveParams = {
  expand: ["items.data"],
} satisfies Stripe.SubscriptionRetrieveParams;

function unixSecondsToIsoOrNull(value: number | null | undefined): string | null {
  if (value == null || typeof value !== "number") {
    return null;
  }

  const date = new Date(value * 1000);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** Stripe SDK v22+ exposes period bounds on line items, not the subscription root. */
function resolveSubscriptionCurrentPeriodEndSeconds(subscription: Stripe.Subscription): number | null {
  const items = subscription.items?.data;
  if (Array.isArray(items) && items.length > 0) {
    let maxEnd: number | null = null;
    for (const item of items) {
      const end = item.current_period_end;
      if (typeof end === "number" && (maxEnd === null || end > maxEnd)) {
        maxEnd = end;
      }
    }
    if (maxEnd !== null) {
      return maxEnd;
    }
  }

  const legacy = subscription as { current_period_end?: number | null | undefined };
  return typeof legacy.current_period_end === "number" ? legacy.current_period_end : null;
}

export function mapSubscriptionStatus(
  status: Stripe.Subscription.Status,
): "active" | "trialing" | "past_due" | "canceled" {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
    case "incomplete_expired":
    case "paused":
      return "canceled";
    case "incomplete":
      return "past_due";
    default:
      return "active";
  }
}

export async function updateProfileBillingFields(input: Readonly<{
  userId: string;
  tier: BillingPlanTier;
  billingStatus: "active" | "trialing" | "past_due" | "canceled";
  trialEndsAtIso: string | null;
  cycleAnchorIso: string | null;
  /** Stripe `subscription.current_period_end` — next regular invoice time. */
  currentPeriodEndsAtIso: string | null;
}>): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      billing_plan_tier: input.tier,
      billing_status: input.billingStatus,
      billing_trial_ends_at: input.trialEndsAtIso,
      billing_cycle_anchor: input.cycleAnchorIso,
      billing_current_period_ends_at: input.currentPeriodEndsAtIso,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.userId);

  if (error) {
    console.error("[billing] profile update failed", error.message, error.code, error.details);
    throw new Error(error.message);
  }
}

export function subscriptionBillingPayload(subscription: Stripe.Subscription): Readonly<{
  billingStatus: ReturnType<typeof mapSubscriptionStatus>;
  trialEndsAtIso: string | null;
  cycleAnchorIso: string | null;
  currentPeriodEndsAtIso: string | null;
}> {
  return {
    billingStatus: mapSubscriptionStatus(subscription.status),
    trialEndsAtIso: unixSecondsToIsoOrNull(subscription.trial_end),
    cycleAnchorIso: unixSecondsToIsoOrNull(subscription.billing_cycle_anchor),
    currentPeriodEndsAtIso: unixSecondsToIsoOrNull(
      resolveSubscriptionCurrentPeriodEndSeconds(subscription),
    ),
  };
}

/**
 * When `profiles.billing_current_period_ends_at` was never filled (webhook gaps, older
 * sync, or retrieve without expanded `items`), find this user's Stripe subscription via
 * subscription metadata `supabase_user_id` and read `current_period_end` from line items.
 */
export async function fetchCurrentPeriodEndIsoFromStripeForSupabaseUser(
  supabaseUserId: string,
): Promise<string | null> {
  if (isBillingDisabled() || !process.env.STRIPE_SECRET_KEY?.trim()) {
    return null;
  }

  try {
    const stripe = getStripe();
    const query = `metadata["supabase_user_id"]:"${supabaseUserId}"`;
    const res = await stripe.subscriptions.search({ query, limit: 10 });
    const preferred = res.data.find((s) =>
      s.status === "active" || s.status === "trialing" || s.status === "past_due",
    );
    const sub = preferred ?? res.data[0];
    if (!sub) {
      return null;
    }

    const fresh = await stripe.subscriptions.retrieve(sub.id, stripeSubscriptionRetrieveParams);
    return subscriptionBillingPayload(fresh).currentPeriodEndsAtIso;
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    console.warn("[billing] stripe period recovery via search failed", message);
    return null;
  }
}
