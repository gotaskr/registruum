alter table public.archive_folders
  add column if not exists space_id uuid references public.spaces(id) on delete cascade;

drop index if exists archive_folders_system_default_per_owner_idx;

create unique index if not exists archive_folders_system_default_per_space_idx
  on public.archive_folders (space_id)
  where is_system_default = true
    and space_id is not null;

create index if not exists archive_folders_space_parent_idx
  on public.archive_folders (space_id, parent_id, name)
  where space_id is not null;

with folder_space_candidates as (
  select
    archived_work_orders.archive_folder_id as folder_id,
    min(archived_work_orders.space_id::text)::uuid as space_id,
    count(distinct archived_work_orders.space_id) as space_count
  from public.archived_work_orders
  group by archived_work_orders.archive_folder_id
)
update public.archive_folders as archive_folders
set
  space_id = folder_space_candidates.space_id,
  owner_user_id = null
from folder_space_candidates
where archive_folders.id = folder_space_candidates.folder_id
  and archive_folders.space_id is null
  and folder_space_candidates.space_count = 1;

do $$
declare
  updated_rows integer;
begin
  loop
    update public.archive_folders as child_folders
    set
      space_id = parent_folders.space_id,
      owner_user_id = null
    from public.archive_folders as parent_folders
    where child_folders.parent_id = parent_folders.id
      and child_folders.space_id is null
      and parent_folders.space_id is not null;

    get diagnostics updated_rows = row_count;
    exit when updated_rows = 0;
  end loop;
end;
$$;

insert into public.archive_folders (
  name,
  parent_id,
  created_by_user_id,
  owner_user_id,
  space_id,
  is_system_default
)
select
  'Unsorted Archive',
  null,
  spaces.created_by_user_id,
  null,
  archive_spaces.space_id,
  true
from (
  select distinct archived_work_orders.space_id
  from public.archived_work_orders
  union
  select distinct archive_folders.space_id
  from public.archive_folders
  where archive_folders.space_id is not null
) as archive_spaces
join public.spaces
  on spaces.id = archive_spaces.space_id
where archive_spaces.space_id is not null
  and not exists (
    select 1
    from public.archive_folders as existing_default
    where existing_default.space_id = archive_spaces.space_id
      and existing_default.is_system_default = true
  );

update public.archived_work_orders as archived_work_orders
set archive_folder_id = default_folders.id
from public.archive_folders as current_folders,
  public.archive_folders as default_folders
where current_folders.id = archived_work_orders.archive_folder_id
  and default_folders.space_id = archived_work_orders.space_id
  and default_folders.is_system_default = true
  and (
    current_folders.space_id is null
    or current_folders.space_id is distinct from archived_work_orders.space_id
  );

with folder_space_candidates as (
  select
    archived_work_orders.archive_folder_id as folder_id,
    min(archived_work_orders.space_id::text)::uuid as space_id,
    count(distinct archived_work_orders.space_id) as space_count
  from public.archived_work_orders
  group by archived_work_orders.archive_folder_id
)
update public.archive_folders as archive_folders
set
  space_id = folder_space_candidates.space_id,
  owner_user_id = null
from folder_space_candidates
where archive_folders.id = folder_space_candidates.folder_id
  and folder_space_candidates.space_count = 1
  and archive_folders.space_id is distinct from folder_space_candidates.space_id;

do $$
declare
  updated_rows integer;
begin
  loop
    update public.archive_folders as child_folders
    set
      space_id = parent_folders.space_id,
      owner_user_id = null
    from public.archive_folders as parent_folders
    where child_folders.parent_id = parent_folders.id
      and child_folders.space_id is null
      and parent_folders.space_id is not null;

    get diagnostics updated_rows = row_count;
    exit when updated_rows = 0;
  end loop;
end;
$$;

update public.archive_folders
set
  owner_user_id = null,
  is_system_default = false
where space_id is null
  and is_system_default = true;

update public.archive_folders as archive_folders
set owner_user_id = null
where archive_folders.space_id is not null
  and archive_folders.owner_user_id is not null;

update public.archive_folders as child_folders
set parent_id = null
from public.archive_folders as parent_folders
where parent_folders.id = child_folders.parent_id
  and (
    child_folders.space_id is null
    or parent_folders.space_id is distinct from child_folders.space_id
  );

create or replace function public.can_access_shared_archive_space(target_space_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    target_space_id is not null
    and auth.uid() is not null
    and public.has_space_role(
      target_space_id,
      array[
        'admin'::public.app_role,
        'operations_manager'::public.app_role,
        'manager'::public.app_role,
        'field_lead_superintendent'::public.app_role
      ]
    );
$$;

create or replace function public.can_access_archive()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.space_memberships
    where space_memberships.user_id = auth.uid()
      and space_memberships.status = 'active'
      and space_memberships.role = any (
        array[
          'admin'::public.app_role,
          'operations_manager'::public.app_role,
          'manager'::public.app_role,
          'field_lead_superintendent'::public.app_role
        ]
      )
  );
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
      and archive_folders.space_id is not null
      and public.can_access_shared_archive_space(archive_folders.space_id)
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
      and archived_work_orders.space_id is not null
      and public.can_access_shared_archive_space(archived_work_orders.space_id)
  );
$$;

drop policy if exists "archive_folders_select_authenticated" on public.archive_folders;
drop policy if exists "archive_folders_select_members" on public.archive_folders;
create policy "archive_folders_select_members"
on public.archive_folders
for select
to authenticated
using (
  space_id is not null
  and public.can_access_shared_archive_space(space_id)
);

drop policy if exists "archive_folders_insert_authenticated" on public.archive_folders;
drop policy if exists "archive_folders_insert_members" on public.archive_folders;
create policy "archive_folders_insert_members"
on public.archive_folders
for insert
to authenticated
with check (
  coalesce(created_by_user_id, auth.uid()) = auth.uid()
  and owner_user_id is null
  and is_system_default = false
  and space_id is not null
  and public.can_access_shared_archive_space(space_id)
  and (
    parent_id is null
    or exists (
      select 1
      from public.archive_folders as parent_folders
      where parent_folders.id = archive_folders.parent_id
        and parent_folders.space_id = archive_folders.space_id
        and public.can_access_shared_archive_space(parent_folders.space_id)
    )
  )
);

drop policy if exists "archive_folders_update_authenticated" on public.archive_folders;
drop policy if exists "archive_folders_update_members" on public.archive_folders;
create policy "archive_folders_update_members"
on public.archive_folders
for update
to authenticated
using (
  public.can_access_archive_folder(id)
  and is_system_default = false
)
with check (
  owner_user_id is null
  and is_system_default = false
  and space_id is not null
  and public.can_access_shared_archive_space(space_id)
  and (
    parent_id is null
    or exists (
      select 1
      from public.archive_folders as parent_folders
      where parent_folders.id = archive_folders.parent_id
        and parent_folders.space_id = archive_folders.space_id
        and public.can_access_shared_archive_space(parent_folders.space_id)
    )
  )
);

drop policy if exists "archive_folders_delete_authenticated" on public.archive_folders;
drop policy if exists "archive_folders_delete_members" on public.archive_folders;
create policy "archive_folders_delete_members"
on public.archive_folders
for delete
to authenticated
using (
  public.can_access_archive_folder(id)
  and is_system_default = false
);

drop policy if exists "archived_work_orders_select_members" on public.archived_work_orders;
create policy "archived_work_orders_select_members"
on public.archived_work_orders
for select
to authenticated
using (
  space_id is not null
  and public.can_access_shared_archive_space(space_id)
);

drop policy if exists "archived_work_orders_insert_members" on public.archived_work_orders;
create policy "archived_work_orders_insert_members"
on public.archived_work_orders
for insert
to authenticated
with check (
  space_id is not null
  and public.can_access_shared_archive_space(space_id)
  and public.has_work_order_permission(original_work_order_id, 'archive_work_order')
  and archived_by_user_id = auth.uid()
  and immutable = true
  and status_snapshot = 'archived'::public.work_order_status
  and exists (
    select 1
    from public.archive_folders
    where archive_folders.id = archived_work_orders.archive_folder_id
      and archive_folders.space_id = archived_work_orders.space_id
      and public.can_access_shared_archive_space(archive_folders.space_id)
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
  space_id is not null
  and public.can_access_shared_archive_space(space_id)
)
with check (
  space_id is not null
  and public.can_access_shared_archive_space(space_id)
  and immutable = true
  and status_snapshot = 'archived'::public.work_order_status
  and exists (
    select 1
    from public.archive_folders
    where archive_folders.id = archived_work_orders.archive_folder_id
      and archive_folders.space_id = archived_work_orders.space_id
      and public.can_access_shared_archive_space(archive_folders.space_id)
  )
);

drop policy if exists "archived_work_orders_delete_admins" on public.archived_work_orders;
drop policy if exists "archived_work_orders_delete_owner" on public.archived_work_orders;
create policy "archived_work_orders_delete_owner"
on public.archived_work_orders
for delete
to authenticated
using (
  space_id is not null
  and public.can_access_shared_archive_space(space_id)
);

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
