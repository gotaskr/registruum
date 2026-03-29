create table if not exists public.activity_logs (
  id uuid primary key default extensions.gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  work_order_id uuid references public.work_orders(id) on delete set null,
  actor_user_id uuid references public.profiles(id) on delete set null,
  entity_type public.activity_log_entity_type not null,
  entity_id uuid,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists activity_logs_space_id_created_at_idx
  on public.activity_logs (space_id, created_at desc);

create index if not exists activity_logs_work_order_id_created_at_idx
  on public.activity_logs (work_order_id, created_at desc);
