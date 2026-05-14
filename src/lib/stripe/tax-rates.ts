/**
 * Manual Stripe Tax Rate ids (until Stripe Tax / registrations are ready).
 * Create rates in Dashboard → Products → Tax rates (or API), then list ids here.
 * @see https://docs.stripe.com/billing/taxes/tax-rates
 *
 * Comma-separated, e.g. `txr_abc123,txr_yyy` (max 5 per subscription).
 * Your catalog prices should match how each rate is defined (inclusive vs exclusive).
 * For region-specific rates (e.g. Ontario), Checkout must collect a full billing address
 * (`billing_address_collection: required` is set in checkout when this list is non-empty).
 * Each Stripe **Price** should have **Tax behavior** set (usually **Exclusive**) or tax lines may not appear.
 */
export function getManualSubscriptionTaxRateIds(): string[] {
  const raw = process.env.STRIPE_MANUAL_TAX_RATE_IDS?.trim();
  if (!raw) {
    return [];
  }

  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter((id) => id.length > 0 && id.startsWith("txr_"));

  return ids.slice(0, 5);
}
