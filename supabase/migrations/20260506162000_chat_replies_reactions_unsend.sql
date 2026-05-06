alter table public.work_order_messages
  add column if not exists reply_to_message_id uuid references public.work_order_messages(id) on delete set null,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by_user_id uuid references public.profiles(id) on delete set null;

create index if not exists work_order_messages_reply_to_idx
  on public.work_order_messages (reply_to_message_id);

create table if not exists public.work_order_message_reactions (
  message_id uuid not null references public.work_order_messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction text not null check (reaction in ('up', 'down')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (message_id, user_id)
);

create index if not exists work_order_message_reactions_message_idx
  on public.work_order_message_reactions (message_id);

alter table public.work_order_message_reactions enable row level security;

drop policy if exists "work_order_message_reactions_select_members" on public.work_order_message_reactions;
create policy "work_order_message_reactions_select_members"
on public.work_order_message_reactions
for select
to authenticated
using (
  exists (
    select 1
    from public.work_order_messages
    where work_order_messages.id = work_order_message_reactions.message_id
      and public.can_access_work_order(work_order_messages.work_order_id)
  )
);

drop policy if exists "work_order_message_reactions_insert_members" on public.work_order_message_reactions;
create policy "work_order_message_reactions_insert_members"
on public.work_order_message_reactions
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.work_order_messages
    where work_order_messages.id = work_order_message_reactions.message_id
      and public.can_edit_work_order(work_order_messages.work_order_id)
  )
);

drop policy if exists "work_order_message_reactions_update_members" on public.work_order_message_reactions;
create policy "work_order_message_reactions_update_members"
on public.work_order_message_reactions
for update
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.work_order_messages
    where work_order_messages.id = work_order_message_reactions.message_id
      and public.can_edit_work_order(work_order_messages.work_order_id)
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.work_order_messages
    where work_order_messages.id = work_order_message_reactions.message_id
      and public.can_edit_work_order(work_order_messages.work_order_id)
  )
);

drop policy if exists "work_order_message_reactions_delete_members" on public.work_order_message_reactions;
create policy "work_order_message_reactions_delete_members"
on public.work_order_message_reactions
for delete
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.work_order_messages
    where work_order_messages.id = work_order_message_reactions.message_id
      and public.can_edit_work_order(work_order_messages.work_order_id)
  )
);
