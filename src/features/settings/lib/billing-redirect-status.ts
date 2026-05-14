/**
 * Human-readable copy for `billingStatus` query params set by billing API routes.
 * Helps diagnose checkout/portal redirects in production.
 */
export function describeBillingRedirectStatus(
  status: string | null | undefined,
): { tone: "error" | "info"; message: string } | null {
  if (!status || status === "checkout_success") {
    return null;
  }

  switch (status) {
    case "billing_not_live":
      return {
        tone: "error",
        message:
          "Billing is turned off for this deployment (NEXT_PUBLIC_BILLING_DISABLED=true). Set it to false or remove it, then redeploy.",
      };
    case "stripe_not_connected":
      return {
        tone: "error",
        message:
          "Stripe is not configured on the server. Set STRIPE_SECRET_KEY and STRIPE_PRICE_ID_BASIC for this environment (Production on Vercel), then redeploy.",
      };
    case "stripe_price_missing":
      return {
        tone: "error",
        message:
          "A Stripe Price ID is missing for the plan you chose. Set STRIPE_PRICE_ID_BASIC, STRIPE_PRICE_ID_PRO_TEAM, STRIPE_PRICE_ID_BUSINESS, and STRIPE_PRICE_ID_ENTERPRISE to live price_… values, then redeploy.",
      };
    case "stripe_price_is_product_id":
      return {
        tone: "error",
        message:
          "A billing env var looks like a Stripe Product id (prod_…). Checkout needs the recurring subscription Price id (price_…) from Dashboard → Product → Pricing. Fix Vercel Production env and redeploy.",
      };
    case "checkout_invalid_plan":
      return {
        tone: "error",
        message: "Checkout was started with an invalid plan. Use Plans & pricing to subscribe again.",
      };
    case "checkout_session_error":
      return {
        tone: "error",
        message:
          "Stripe did not return a checkout URL. Check Vercel function logs and your Stripe Dashboard for errors.",
      };
    case "checkout_stripe_error":
      return {
        tone: "error",
        message:
          "Stripe rejected checkout session creation. Open Vercel → this deployment → Logs, filter for “[billing checkout]”, and fix the Stripe error (keys, price mode live/test, or invalid parameters).",
      };
    case "checkout_canceled":
      return {
        tone: "info",
        message: "Checkout was canceled. You can choose a plan again whenever you are ready.",
      };
    case "stripe_email_required":
      return {
        tone: "error",
        message: "Your account needs an email on file before opening the billing portal.",
      };
    case "stripe_no_customer":
      return {
        tone: "error",
        message:
          "No Stripe customer was found for your email yet. Complete a subscription checkout once, or contact support.",
      };
    case "portal_session_error":
    case "portal_stripe_error":
      return {
        tone: "error",
        message:
          "Could not open the billing portal. Check Vercel logs and Stripe Billing Portal settings for this account.",
      };
    case "sync_forbidden":
      return {
        tone: "error",
        message: "Checkout completed but billing could not be synced to your account. Contact support if this persists.",
      };
    default:
      return {
        tone: "info",
        message: `Something went wrong with billing (code: ${status}). Try again or check deployment logs.`,
      };
  }
}
