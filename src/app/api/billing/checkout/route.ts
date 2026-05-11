import { NextResponse } from "next/server";
import { getAuthenticatedAppUserOrNull } from "@/features/auth/api/profiles";
import {
  hasMinimumStripeCheckoutConfig,
  parseCheckoutPlan,
  resolveStripePriceIdForTier,
} from "@/lib/stripe/price-ids";
import { getStripe } from "@/lib/stripe/server";

export async function GET(request: Request) {
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

  const origin = new URL(request.url).origin;
  const user = authenticated.user;
  const email = user.email ?? undefined;

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      payment_method_types: ["card"],
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
      },
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return NextResponse.redirect(
        new URL("/settings?section=subscription&billingStatus=checkout_session_error", request.url),
      );
    }

    return NextResponse.redirect(session.url);
  } catch {
    return NextResponse.redirect(
      new URL("/settings?section=subscription&billingStatus=checkout_stripe_error", request.url),
    );
  }
}
