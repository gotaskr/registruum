import { NextResponse } from "next/server";
import { getAuthenticatedAppUserOrNull } from "@/features/auth/api/profiles";
import { isBillingDisabled } from "@/features/settings/lib/billing-feature-flag";
import {
  hasMinimumStripeCheckoutConfig,
  parseCheckoutPlan,
  resolveStripePriceIdForTier,
} from "@/lib/stripe/price-ids";
import { buildCheckoutSubscriptionLineItem } from "@/lib/stripe/checkout-subscription-line-item";
import { getStripe } from "@/lib/stripe/server";
import { getManualSubscriptionTaxRateIds } from "@/lib/stripe/tax-rates";

export async function GET(request: Request) {
  if (isBillingDisabled()) {
    return NextResponse.redirect(
      new URL("/settings?section=subscription&billingStatus=billing_not_live", request.url),
    );
  }

  const authenticated = await getAuthenticatedAppUserOrNull();

  if (!authenticated) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const url = new URL(request.url);
  const rawPlan = url.searchParams.get("plan");
  const requestedPlan = rawPlan ?? "basic";

  if (!hasMinimumStripeCheckoutConfig()) {
    const fallback = new URL("/settings?section=subscription&billingStatus=stripe_not_connected", request.url);
    fallback.searchParams.set("requestedPlan", requestedPlan);
    return NextResponse.redirect(fallback);
  }

  if (requestedPlan === "free") {
    return NextResponse.redirect(
      new URL("/settings?section=subscription&billingStatus=checkout_invalid_plan", request.url),
    );
  }

  const tier = parseCheckoutPlan(rawPlan);
  const priceId = resolveStripePriceIdForTier(tier);

  if (!priceId) {
    const missing = new URL("/settings?section=subscription&billingStatus=stripe_price_missing", request.url);
    missing.searchParams.set("plan", tier);
    return NextResponse.redirect(missing);
  }

  if (priceId.startsWith("prod_")) {
    console.error(
      "[billing checkout] STRIPE_PRICE_ID_* must be a recurring Price id (price_…), not a Product id (prod_…).",
    );
    const wrong = new URL("/settings?section=subscription&billingStatus=stripe_price_is_product_id", request.url);
    wrong.searchParams.set("plan", tier);
    return NextResponse.redirect(wrong);
  }

  const origin = new URL(request.url).origin;
  const user = authenticated.user;
  const email = user.email ?? undefined;
  const manualTaxRateIds = getManualSubscriptionTaxRateIds();

  try {
    const stripe = getStripe();
    const lineItem = await buildCheckoutSubscriptionLineItem(stripe, priceId);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [lineItem],
      payment_method_types: ["card"],
      /** Region-scoped TaxRates (e.g. Ontario) only apply once province/postal is known. */
      ...(manualTaxRateIds.length > 0 ? { billing_address_collection: "required" as const } : {}),
      wallet_options: {
        link: {
          display: "never",
        },
      },
      success_url: `${origin}/settings?section=subscription&billingStatus=checkout_success&checkout_plan=${encodeURIComponent(tier)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/settings/plans?billingStatus=checkout_canceled`,
      customer_email: email,
      client_reference_id: user.id,
      metadata: {
        supabase_user_id: user.id,
        billing_plan_tier: tier,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          billing_plan_tier: tier,
        },
        ...(manualTaxRateIds.length > 0 ? { default_tax_rates: manualTaxRateIds } : {}),
      },
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return NextResponse.redirect(
        new URL("/settings?section=subscription&billingStatus=checkout_session_error", request.url),
      );
    }

    return NextResponse.redirect(session.url);
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : String(cause);
    // One searchable line for Vercel / hosting log UIs (full-text search often indexes a single string).
    console.error(`[billing checkout] Stripe session create failed: ${detail}`);
    if (cause instanceof Error && cause.stack) {
      console.error(cause.stack);
    }
    return NextResponse.redirect(
      new URL("/settings?section=subscription&billingStatus=checkout_stripe_error", request.url),
    );
  }
}
