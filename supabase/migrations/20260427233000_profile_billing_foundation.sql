alter table public.profiles
  add column if not exists billing_plan_tier text not null default 'free'
    check (billing_plan_tier in ('free', 'basic', 'pro_team', 'business', 'enterprise')),
  add column if not exists billing_status text not null default 'active'
    check (billing_status in ('active', 'trialing', 'past_due', 'canceled')),
  add column if not exists billing_trial_ends_at timestamptz,
  add column if not exists billing_cycle_anchor timestamptz,
  add column if not exists monthly_bandwidth_used_bytes bigint not null default 0
    check (monthly_bandwidth_used_bytes >= 0),
  add column if not exists monthly_bandwidth_window_start date not null
    default date_trunc('month', timezone('utc', now()))::date;
