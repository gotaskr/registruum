create table if not exists public.job_market_posts (
  id uuid primary key default extensions.gen_random_uuid(),
  work_order_id uuid not null unique references public.work_orders(id) on delete cascade,
  space_id uuid not null references public.spaces(id) on delete cascade,
  title_snapshot text not null,
  description_snapshot text,
  location_label text,
  status public.job_market_post_status not null default 'active',
  posted_at timestamptz not null default timezone('utc', now()),
  closed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists job_market_posts_space_id_status_idx
  on public.job_market_posts (space_id, status);
