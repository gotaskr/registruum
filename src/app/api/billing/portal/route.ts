import { NextResponse } from "next/server";
import { getAuthenticatedAppUserOrNull } from "@/features/auth/api/profiles";
import { getStripe } from "@/lib/stripe/server";
import { resolveStripeCustomerForUser } from "@/lib/stripe/resolve-customer";

function hasStripeSecret() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export async function GET(request: Request) {
  const authenticated = await getAuthenticatedAppUserOrNull();

  if (!authenticated) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (!hasStripeSecret()) {
    return NextResponse.redirect(
      new URL("/settings?section=subscription&billingStatus=stripe_not_connected", request.url),
    );
  }

  const email = authenticated.user.email;
  if (!email) {
    return NextResponse.redirect(
      new URL("/settings?section=subscription&billingStatus=stripe_email_required", request.url),
    );
  }

  const origin = new URL(request.url).origin;

  try {
    const stripe = getStripe();
    const resolved = await resolveStripeCustomerForUser(authenticated.user.id, email);

    if (!resolved) {
      return NextResponse.redirect(
        new URL("/settings?section=subscription&billingStatus=stripe_no_customer", request.url),
      );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: resolved.customerId,
      return_url: `${origin}/settings?section=subscription`,
    });

    if (!portalSession.url) {
      return NextResponse.redirect(
        new URL("/settings?section=subscription&billingStatus=portal_session_error", request.url),
      );
    }

    return NextResponse.redirect(portalSession.url);
  } catch {
    return NextResponse.redirect(
      new URL("/settings?section=subscription&billingStatus=portal_stripe_error", request.url),
    );
  }
}
