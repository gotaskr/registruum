alter table public.archive_folders
  add column if not exists owner_user_id uuid references public.profiles(id);

alter table public.archived_work_orders
  add column if not exists owner_user_id uuid references public.profiles(id);

alter table public.archived_work_orders
  disable trigger enforce_archived_work_order_write_rules;

update public.archived_work_orders as archived_work_orders
set owner_user_id = coalesce(
  archived_work_orders.owner_user_id,
  archived_work_orders.archived_by_user_id,
  work_orders.owner_user_id,
  work_orders.created_by_user_id
)
from public.work_orders
where work_orders.id = archived_work_orders.original_work_order_id
  and archived_work_orders.owner_user_id is null;

update public.archive_folders as archive_folders
set owner_user_id = archive_folders.created_by_user_id
where archive_folders.owner_user_id is null
  and archive_folders.created_by_user_id is not null;

update public.archive_folders as archive_folders
set owner_user_id = coalesce(
  archive_folders.owner_user_id,
  folder_owner_lookup.owner_user_id
)
from (
  select
    archived_work_orders.archive_folder_id as folder_id,
    min(archived_work_orders.owner_user_id::text)::uuid as owner_user_id
  from public.archived_work_orders
  where archived_work_orders.owner_user_id is not null
  group by archived_work_orders.archive_folder_id
) as folder_owner_lookup
where archive_folders.id = folder_owner_lookup.folder_id
  and archive_folders.owner_user_id is null;

drop index if exists archive_folders_single_system_default_idx;

create unique index if not exists archive_folders_system_default_per_owner_idx
  on public.archive_folders (owner_user_id)
  where is_system_default = true
    and owner_user_id is not null;

insert into public.archive_folders (
  name,
  parent_id,
  created_by_user_id,
  owner_user_id,
  is_system_default
)
select
  'Unsorted Archive',
  null,
  archive_owners.user_id,
  archive_owners.user_id,
  true
from (
  select distinct archived_work_orders.owner_user_id as user_id
  from public.archived_work_orders
  where archived_work_orders.owner_user_id is not null
  union
  select distinct coalesce(archive_folders.owner_user_id, archive_folders.created_by_user_id) as user_id
  from public.archive_folders
  where coalesce(archive_folders.owner_user_id, archive_folders.created_by_user_id) is not null
) as archive_owners
where not exists (
  select 1
  from public.archive_folders as existing_default
  where existing_default.owner_user_id = archive_owners.user_id
    and existing_default.is_system_default = true
);

update public.archived_work_orders as archived_work_orders
set archive_folder_id = default_folders.id
from public.archive_folders as current_folders,
  public.archive_folders as default_folders
where current_folders.id = archived_work_orders.archive_folder_id
  and archived_work_orders.owner_user_id is not null
  and default_folders.owner_user_id = archived_work_orders.owner_user_id
  and default_folders.is_system_default = true
  and current_folders.owner_user_id is distinct from archived_work_orders.owner_user_id;

update public.archive_folders as child_folders
set parent_id = null
from public.archive_folders as parent_folders
where parent_folders.id = child_folders.parent_id
  and child_folders.owner_user_id is not null
  and parent_folders.owner_user_id is distinct from child_folders.owner_user_id;

do $$
begin
  if exists (
    select 1
    from public.archived_work_orders
    where owner_user_id is null
  ) then
    raise exception 'Unable to backfill archive record owners.';
  end if;
end;
$$;

alter table public.archived_work_orders
  alter column owner_user_id set not null;

alter table public.archived_work_orders
  enable trigger enforce_archived_work_order_write_rules;

create index if not exists archive_folders_owner_parent_idx
  on public.archive_folders (owner_user_id, parent_id, name);

create index if not exists archived_work_orders_owner_idx
  on public.archived_work_orders (owner_user_id, archived_at desc);

create or replace function public.can_access_archive()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null;
$$;

create or replace function public.can_access_archive_folder(target_folder_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.archive_folders
    where archive_folders.id = target_folder_id
      and archive_folders.owner_user_id = auth.uid()
  );
$$;

create or replace function public.can_access_archived_work_order(target_archived_work_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.archived_work_orders
    where archived_work_orders.id = target_archived_work_order_id
      and archived_work_orders.owner_user_id = auth.uid()
      and public.can_access_work_order(archived_work_orders.original_work_order_id)
  );
$$;

drop policy if exists "archive_folders_select_authenticated" on public.archive_folders;
drop policy if exists "archive_folders_select_members" on public.archive_folders;
create policy "archive_folders_select_members"
on public.archive_folders
for select
to authenticated
using (owner_user_id = auth.uid());

drop policy if exists "archive_folders_insert_authenticated" on public.archive_folders;
drop policy if exists "archive_folders_insert_members" on public.archive_folders;
create policy "archive_folders_insert_members"
on public.archive_folders
for insert
to authenticated
with check (
  owner_user_id = auth.uid()
  and coalesce(created_by_user_id, auth.uid()) = auth.uid()
  and is_system_default = false
  and (
    parent_id is null
    or public.can_access_archive_folder(parent_id)
  )
);

drop policy if exists "archive_folders_update_authenticated" on public.archive_folders;
drop policy if exists "archive_folders_update_members" on public.archive_folders;
create policy "archive_folders_update_members"
on public.archive_folders
for update
to authenticated
using (
  owner_user_id = auth.uid()
  and is_system_default = false
)
with check (
  owner_user_id = auth.uid()
  and is_system_default = false
  and (
    parent_id is null
    or public.can_access_archive_folder(parent_id)
  )
);

drop policy if exists "archive_folders_delete_authenticated" on public.archive_folders;
drop policy if exists "archive_folders_delete_members" on public.archive_folders;
create policy "archive_folders_delete_members"
on public.archive_folders
for delete
to authenticated
using (
  owner_user_id = auth.uid()
  and is_system_default = false
);

drop policy if exists "archived_work_orders_select_members" on public.archived_work_orders;
create policy "archived_work_orders_select_members"
on public.archived_work_orders
for select
to authenticated
using (
  owner_user_id = auth.uid()
  and public.can_access_work_order(original_work_order_id)
);

drop policy if exists "archived_work_orders_insert_members" on public.archived_work_orders;
create policy "archived_work_orders_insert_members"
on public.archived_work_orders
for insert
to authenticated
with check (
  owner_user_id = auth.uid()
  and public.can_access_work_order(original_work_order_id)
  and public.has_work_order_permission(original_work_order_id, 'archive_work_order')
  and archived_by_user_id = auth.uid()
  and immutable = true
  and status_snapshot = 'archived'::public.work_order_status
  and exists (
    select 1
    from public.archive_folders
    where archive_folders.id = archived_work_orders.archive_folder_id
      and archive_folders.owner_user_id = auth.uid()
  )
  and exists (
    select 1
    from public.work_orders
    where work_orders.id = archived_work_orders.original_work_order_id
      and work_orders.space_id = archived_work_orders.space_id
      and work_orders.status = 'archived'::public.work_order_status
  )
);

drop policy if exists "archived_work_orders_update_members" on public.archived_work_orders;
create policy "archived_work_orders_update_members"
on public.archived_work_orders
for update
to authenticated
using (
  owner_user_id = auth.uid()
  and public.can_access_work_order(original_work_order_id)
)
with check (
  owner_user_id = auth.uid()
  and public.can_access_work_order(original_work_order_id)
  and immutable = true
  and exists (
    select 1
    from public.archive_folders
    where archive_folders.id = archived_work_orders.archive_folder_id
      and archive_folders.owner_user_id = auth.uid()
  )
);

drop policy if exists "archived_work_orders_delete_admins" on public.archived_work_orders;
drop policy if exists "archived_work_orders_delete_owner" on public.archived_work_orders;
create policy "archived_work_orders_delete_owner"
on public.archived_work_orders
for delete
to authenticated
using (owner_user_id = auth.uid());

drop policy if exists "archive_activity_logs_select_members" on public.archive_activity_logs;
create policy "archive_activity_logs_select_members"
on public.archive_activity_logs
for select
to authenticated
using (
  (archived_work_order_id is not null and public.can_access_archived_work_order(archived_work_order_id))
  or (archived_work_order_id is null and archive_folder_id is not null and public.can_access_archive_folder(archive_folder_id))
);

drop policy if exists "archive_activity_logs_insert_members" on public.archive_activity_logs;
create policy "archive_activity_logs_insert_members"
on public.archive_activity_logs
for insert
to authenticated
with check (
  actor_user_id = auth.uid()
  and (
    archived_work_order_id is null
    or public.can_access_archived_work_order(archived_work_order_id)
  )
  and (
    archive_folder_id is null
    or public.can_access_archive_folder(archive_folder_id)
  )
);
