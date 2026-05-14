import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  stripeSubscriptionRetrieveParams,
  subscriptionBillingPayload,
  updateProfileBillingFields,
} from "@/features/settings/api/billing-profile-update";
import { resolveBillingPlanTierFromStripeSubscription } from "@/features/settings/lib/billing-stripe-tier";
import { isBillingDisabled } from "@/features/settings/lib/billing-feature-flag";
import { getStripe } from "@/lib/stripe/server";

export const runtime = "nodejs";

function resolveUserIdFromSubscription(sub: Stripe.Subscription): string | null {
  const fromMeta = sub.metadata?.supabase_user_id;
  return typeof fromMeta === "string" && fromMeta.trim() ? fromMeta.trim() : null;
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

  const subscription = await getStripe().subscriptions.retrieve(
    subscriptionId,
    stripeSubscriptionRetrieveParams,
  );

  const tier = resolveBillingPlanTierFromStripeSubscription(subscription, {
    sessionMetadataTier: session.metadata?.billing_plan_tier,
  });

  const payload = subscriptionBillingPayload(subscription);

  await updateProfileBillingFields({
    userId,
    tier,
    billingStatus: payload.billingStatus,
    trialEndsAtIso: payload.trialEndsAtIso,
    cycleAnchorIso: payload.cycleAnchorIso,
    currentPeriodEndsAtIso: payload.currentPeriodEndsAtIso,
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = resolveUserIdFromSubscription(subscription);
  if (!userId) {
    return;
  }

  const fresh = await getStripe().subscriptions.retrieve(
    subscription.id,
    stripeSubscriptionRetrieveParams,
  );

  const tier = resolveBillingPlanTierFromStripeSubscription(fresh);

  const payload = subscriptionBillingPayload(fresh);

  await updateProfileBillingFields({
    userId,
    tier,
    billingStatus: payload.billingStatus,
    trialEndsAtIso: payload.trialEndsAtIso,
    cycleAnchorIso: payload.cycleAnchorIso,
    currentPeriodEndsAtIso: payload.currentPeriodEndsAtIso,
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = resolveUserIdFromSubscription(subscription);
  if (!userId) {
    return;
  }

  await updateProfileBillingFields({
    userId,
    tier: "free",
    billingStatus: "canceled",
    trialEndsAtIso: null,
    cycleAnchorIso: null,
    currentPeriodEndsAtIso: null,
  });
}

export async function POST(request: Request) {
  if (isBillingDisabled()) {
    return NextResponse.json({ received: true, skipped: true });
  }

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
