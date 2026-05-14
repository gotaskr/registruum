import "server-only";

import type Stripe from "stripe";

type CheckoutSessionCreateLineItem = NonNullable<
  NonNullable<Parameters<Stripe["checkout"]["sessions"]["create"]>[0]>["line_items"]
>[number];

/**
 * Stripe Checkout cannot disable a catalog Price's built-in trial via `subscription_data`
 * (no `trial_end: "now"`, no past timestamps). If the Price has `recurring.trial_period_days`,
 * we duplicate a simple flat recurring amount with `price_data`, which has no trial.
 * Plan tier stays on `subscription_data.metadata.billing_plan_tier` from the checkout route.
 */
export async function buildCheckoutSubscriptionLineItem(
  stripe: Stripe,
  priceId: string,
): Promise<CheckoutSessionCreateLineItem> {
  const price = await stripe.prices.retrieve(priceId);

  if (!price.active) {
    throw new Error(`Stripe price ${priceId} is not active`);
  }

  if (price.type !== "recurring" || !price.recurring) {
    throw new Error(`Stripe price ${priceId} is not recurring`);
  }

  const { recurring } = price;
  const trialDays = recurring.trial_period_days ?? 0;

  if (trialDays <= 0) {
    return { price: priceId, quantity: 1 };
  }

  const isSimpleFlat =
    price.billing_scheme === "per_unit" &&
    price.unit_amount !== null &&
    recurring.usage_type !== "metered";

  if (!isSimpleFlat) {
    throw new Error(
      "This Stripe price has a free trial but is not a plain per-unit recurring price. Remove the trial on the price in the Stripe Dashboard, or use a flat (non-metered) price.",
    );
  }

  const productId = typeof price.product === "string" ? price.product : price.product?.id;
  if (!productId) {
    throw new Error(`Stripe price ${priceId} is missing a product`);
  }

  const unitAmount = price.unit_amount;
  if (unitAmount === null) {
    throw new Error(`Stripe price ${priceId} has no unit_amount`);
  }

  const priceData: NonNullable<CheckoutSessionCreateLineItem["price_data"]> = {
    currency: price.currency,
    unit_amount: unitAmount,
    product: productId,
    recurring: {
      interval: recurring.interval,
      ...(recurring.interval_count != null && recurring.interval_count > 1
        ? { interval_count: recurring.interval_count }
        : {}),
    },
  };

  if (price.tax_behavior === "exclusive" || price.tax_behavior === "inclusive") {
    priceData.tax_behavior = price.tax_behavior;
  }

  return {
    quantity: 1,
    price_data: priceData,
  };
}
