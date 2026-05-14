alter table public.profiles
  add column if not exists billing_current_period_ends_at timestamptz;

comment on column public.profiles.billing_current_period_ends_at is
  'Stripe subscription.current_period_end (next invoice date); updated via billing webhooks and post-checkout sync.';
