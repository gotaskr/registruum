/**
 * Set `NEXT_PUBLIC_BILLING_DISABLED=true` on hosted environments until Stripe is ready
 * for production. Hides billing in the UI and blocks checkout, portal, and plans page.
 * Omit or set to anything other than `true` in `.env.local` while developing billing.
 */
export function isBillingDisabled(): boolean {
  return process.env.NEXT_PUBLIC_BILLING_DISABLED === "true";
}
