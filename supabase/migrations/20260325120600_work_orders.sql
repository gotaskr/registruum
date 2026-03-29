create table if not exists public.work_orders (
  id uuid primary key default extensions.gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  created_by_user_id uuid not null references public.profiles(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 1 and 200),
  location_label text,
  unit_label text,
  description text,
  expiration_at timestamptz,
  status public.work_order_status not null default 'open',
  is_posted_to_job_market boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists work_orders_space_id_created_at_idx
  on public.work_orders (space_id, created_at desc);

create index if not exists work_orders_space_id_status_idx
  on public.work_orders (space_id, status);
