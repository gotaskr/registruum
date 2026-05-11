import "server-only";

import { getStripe } from "@/lib/stripe/server";

/**
 * Finds the Stripe customer for this app user.
 * Prefers a customer with a subscription whose metadata includes `supabase_user_id`,
 * then falls back to the first customer returned for the email (legacy checkouts).
 */
export async function resolveStripeCustomerForUser(
  supabaseUserId: string,
  email: string | null,
): Promise<{ customerId: string } | null> {
  if (!process.env.STRIPE_SECRET_KEY?.trim()) {
    return null;
  }

  if (!email?.trim()) {
    return null;
  }

  const stripe = getStripe();
  const customers = await stripe.customers.list({ email: email.trim(), limit: 15 });

  for (const customer of customers.data) {
    const subs = await stripe.subscriptions.list({
      customer: customer.id,
      status: "all",
      limit: 25,
    });

    const owned = subs.data.find((s) => s.metadata?.supabase_user_id === supabaseUserId);
    if (owned) {
      return { customerId: customer.id };
    }
  }

  if (customers.data.length > 0) {
    return { customerId: customers.data[0].id };
  }

  return null;
}
