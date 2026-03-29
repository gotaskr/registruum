create table if not exists public.work_order_messages (
  id uuid primary key default extensions.gen_random_uuid(),
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  sender_user_id uuid not null references public.profiles(id) on delete restrict,
  body text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists work_order_messages_work_order_id_created_at_idx
  on public.work_order_messages (work_order_id, created_at asc);
