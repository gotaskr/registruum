create table if not exists public.work_order_memberships (
  id uuid primary key default extensions.gen_random_uuid(),
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  assigned_by_user_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  unique (work_order_id, user_id)
);

create index if not exists work_order_memberships_user_id_idx
  on public.work_order_memberships (user_id);
