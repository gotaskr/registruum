create table if not exists public.archive_folders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_id uuid references public.archive_folders(id) on delete set null,
  created_by_user_id uuid references public.profiles(id) on delete set null,
  is_system_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint archive_folders_name_check check (char_length(trim(name)) > 0)
);

create unique index if not exists archive_folders_single_system_default_idx
  on public.archive_folders (is_system_default)
  where is_system_default = true;

create index if not exists archive_folders_parent_idx
  on public.archive_folders (parent_id);

insert into public.archive_folders (
  name,
  is_system_default
)
select
  'Unsorted Archive',
  true
where not exists (
  select 1
  from public.archive_folders
  where is_system_default = true
);

create table if not exists public.archived_work_orders (
  id uuid primary key default gen_random_uuid(),
  original_work_order_id uuid not null unique references public.work_orders(id) on delete restrict,
  archive_folder_id uuid not null references public.archive_folders(id) on delete restrict,
  archived_by_user_id uuid references public.profiles(id) on delete set null,
  archived_at timestamptz not null default timezone('utc', now()),
  title_snapshot text not null,
  space_id uuid not null references public.spaces(id) on delete cascade,
  status_snapshot public.work_order_status not null,
  immutable boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists archived_work_orders_folder_idx
  on public.archived_work_orders (archive_folder_id, archived_at desc);

create index if not exists archived_work_orders_space_idx
  on public.archived_work_orders (space_id, archived_at desc);

insert into public.archived_work_orders (
  original_work_order_id,
  archive_folder_id,
  archived_by_user_id,
  archived_at,
  title_snapshot,
  space_id,
  status_snapshot,
  immutable
)
select
  work_order.id,
  (
    select archive_folder.id
    from public.archive_folders as archive_folder
    where archive_folder.is_system_default = true
    limit 1
  ),
  work_order.owner_user_id,
  coalesce(work_order.updated_at, work_order.created_at, timezone('utc', now())),
  work_order.title,
  work_order.space_id,
  'archived'::public.work_order_status,
  true
from public.work_orders as work_order
where work_order.status = 'archived'::public.work_order_status
  and not exists (
    select 1
    from public.archived_work_orders
    where archived_work_orders.original_work_order_id = work_order.id
  );

create table if not exists public.archive_activity_logs (
  id uuid primary key default gen_random_uuid(),
  archived_work_order_id uuid references public.archived_work_orders(id) on delete cascade,
  archive_folder_id uuid references public.archive_folders(id) on delete cascade,
  action text not null,
  actor_user_id uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists archive_activity_logs_work_order_idx
  on public.archive_activity_logs (archived_work_order_id, created_at desc);

create index if not exists archive_activity_logs_folder_idx
  on public.archive_activity_logs (archive_folder_id, created_at desc);

alter table public.archive_folders enable row level security;
alter table public.archived_work_orders enable row level security;
alter table public.archive_activity_logs enable row level security;

drop policy if exists "archive_folders_select_authenticated" on public.archive_folders;
create policy "archive_folders_select_authenticated"
on public.archive_folders
for select
to authenticated
using (true);

drop policy if exists "archive_folders_insert_authenticated" on public.archive_folders;
create policy "archive_folders_insert_authenticated"
on public.archive_folders
for insert
to authenticated
with check (true);

drop policy if exists "archive_folders_update_authenticated" on public.archive_folders;
create policy "archive_folders_update_authenticated"
on public.archive_folders
for update
to authenticated
using (true)
with check (true);

drop policy if exists "archive_folders_delete_authenticated" on public.archive_folders;
create policy "archive_folders_delete_authenticated"
on public.archive_folders
for delete
to authenticated
using (true);

drop policy if exists "archived_work_orders_select_members" on public.archived_work_orders;
create policy "archived_work_orders_select_members"
on public.archived_work_orders
for select
to authenticated
using (public.can_access_work_order(original_work_order_id));

drop policy if exists "archive_activity_logs_select_members" on public.archive_activity_logs;
create policy "archive_activity_logs_select_members"
on public.archive_activity_logs
for select
to authenticated
using (
  archived_work_order_id is null
  or exists (
    select 1
    from public.archived_work_orders
    where archived_work_orders.id = archive_activity_logs.archived_work_order_id
      and public.can_access_work_order(archived_work_orders.original_work_order_id)
  )
);

drop trigger if exists set_archive_folders_updated_at on public.archive_folders;
create trigger set_archive_folders_updated_at
before update on public.archive_folders
for each row
execute function public.set_updated_at();

drop trigger if exists set_archived_work_orders_updated_at on public.archived_work_orders;
create trigger set_archived_work_orders_updated_at
before update on public.archived_work_orders
for each row
execute function public.set_updated_at();

create or replace function public.enforce_work_order_write_rules()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  settings_changed boolean;
  status_changed boolean;
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role' then
    return new;
  end if;

  settings_changed :=
    (to_jsonb(new) - array['status', 'updated_at']) is distinct from
    (to_jsonb(old) - array['status', 'updated_at']);
  status_changed := new.status is distinct from old.status;

  if old.status = 'archived'::public.work_order_status
     and (settings_changed or status_changed) then
    raise exception 'Archived work orders are immutable.';
  end if;

  if settings_changed then
    if not public.has_work_order_permission(old.id, 'manage_work_order_settings') then
      raise exception 'You cannot edit this work order.';
    end if;
  end if;

  if status_changed then
    if new.status = 'archived'::public.work_order_status then
      if not public.has_work_order_permission(old.id, 'archive_work_order') then
        raise exception 'You cannot archive this work order.';
      end if;
    elsif old.status = 'completed'::public.work_order_status then
      if not public.has_work_order_permission(old.id, 'reopen_work_order') then
        raise exception 'You cannot reopen this work order.';
      end if;
    elsif not public.has_work_order_permission(old.id, 'change_work_order_status') then
      raise exception 'You cannot change the lifecycle status for this work order.';
    end if;
  end if;

  return new;
end;
$$;
