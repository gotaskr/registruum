import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { resolveBillingPlanTier, type BillingPlanTier } from "@/features/settings/lib/subscription-plans";
import { getStripe } from "@/lib/stripe/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function unixSecondsToIsoOrNull(value: number | null | undefined): string | null {
  if (value == null || typeof value !== "number") {
    return null;
  }

  const date = new Date(value * 1000);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function mapSubscriptionStatus(
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

async function updateProfileBilling(input: Readonly<{
  userId: string;
  tier: BillingPlanTier;
  billingStatus: "active" | "trialing" | "past_due" | "canceled";
  trialEndsAtIso: string | null;
  cycleAnchorIso: string | null;
}>) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      billing_plan_tier: input.tier,
      billing_status: input.billingStatus,
      billing_trial_ends_at: input.trialEndsAtIso,
      billing_cycle_anchor: input.cycleAnchorIso,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.userId);

  if (error) {
    console.error("[billing webhook] profile update failed", error.message, error.code, error.details);
    throw new Error(error.message);
  }
}

function resolveUserIdFromSubscription(sub: Stripe.Subscription): string | null {
  const fromMeta = sub.metadata?.supabase_user_id;
  return typeof fromMeta === "string" && fromMeta.trim() ? fromMeta.trim() : null;
}

function resolveTierFromSubscription(sub: Stripe.Subscription): BillingPlanTier {
  return resolveBillingPlanTier(sub.metadata?.billing_plan_tier);
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== "subscription") {
    return;
  }

  const userId =
    (typeof session.client_reference_id === "string" && session.client_reference_id.trim()
      ? session.client_reference_id.trim()
      : null) ??
    (typeof session.metadata?.supabase_user_id === "string" && session.metadata.supabase_user_id.trim()
      ? session.metadata.supabase_user_id.trim()
      : null);

  if (!userId) {
    console.warn("[billing webhook] checkout.session.completed missing user id");
    return;
  }

  const tier = resolveBillingPlanTier(session.metadata?.billing_plan_tier);
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription && typeof session.subscription === "object" && "id" in session.subscription
        ? session.subscription.id
        : null;

  if (!subscriptionId) {
    console.warn("[billing webhook] checkout.session.completed missing subscription id");
    return;
  }

  const subscription = await getStripe().subscriptions.retrieve(subscriptionId);

  await updateProfileBilling({
    userId,
    tier,
    billingStatus: mapSubscriptionStatus(subscription.status),
    trialEndsAtIso: unixSecondsToIsoOrNull(subscription.trial_end),
    cycleAnchorIso: unixSecondsToIsoOrNull(subscription.billing_cycle_anchor),
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = resolveUserIdFromSubscription(subscription);
  if (!userId) {
    return;
  }

  const tier = resolveTierFromSubscription(subscription);

  await updateProfileBilling({
    userId,
    tier,
    billingStatus: mapSubscriptionStatus(subscription.status),
    trialEndsAtIso: unixSecondsToIsoOrNull(subscription.trial_end),
    cycleAnchorIso: unixSecondsToIsoOrNull(subscription.billing_cycle_anchor),
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = resolveUserIdFromSubscription(subscription);
  if (!userId) {
    return;
  }

  await updateProfileBilling({
    userId,
    tier: "free",
    billingStatus: "canceled",
    trialEndsAtIso: null,
    cycleAnchorIso: null,
  });
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[billing webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const signature = (await headers()).get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      default:
        break;
    }
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    console.error("[billing webhook] handler error", message);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
