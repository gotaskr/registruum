-- Permanent read-only per-user record when a work order is completed (RLS: select own only).

create table if not exists public.completed_work_order_history (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  work_order_id uuid references public.work_orders(id) on delete set null,
  space_id uuid references public.spaces(id) on delete set null,
  completed_at timestamptz not null,
  space_name_snapshot text not null,
  work_order_title_snapshot text not null,
  role_snapshot text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists completed_work_order_history_user_work_order_key
  on public.completed_work_order_history (user_id, work_order_id)
  where work_order_id is not null;

create index if not exists completed_work_order_history_user_completed_idx
  on public.completed_work_order_history (user_id, completed_at desc);

alter table public.completed_work_order_history enable row level security;

drop policy if exists "completed_work_order_history_select_own" on public.completed_work_order_history;
create policy "completed_work_order_history_select_own"
  on public.completed_work_order_history
  for select
  to authenticated
  using (auth.uid() = user_id);

grant select on table public.completed_work_order_history to authenticated;
