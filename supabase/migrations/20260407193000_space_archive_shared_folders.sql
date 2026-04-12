alter table public.archive_folders
  add column if not exists space_id uuid references public.spaces(id) on delete cascade;

create index if not exists archive_folders_space_parent_idx
  on public.archive_folders (space_id, parent_id, name)
  where space_id is not null;

create unique index if not exists archive_folders_system_default_per_space_idx
  on public.archive_folders (space_id)
  where is_system_default = true
    and space_id is not null;

create or replace function public.can_access_shared_archive_space(target_space_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth.uid() is not null
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
      and (
        archive_folders.owner_user_id = auth.uid()
        or (
          archive_folders.space_id is not null
          and public.can_access_shared_archive_space(archive_folders.space_id)
        )
      )
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
      and (
        archived_work_orders.owner_user_id = auth.uid()
        or public.can_access_shared_archive_space(archived_work_orders.space_id)
      )
      and public.can_access_work_order(archived_work_orders.original_work_order_id)
  );
$$;

drop policy if exists "archive_folders_select_members" on public.archive_folders;
create policy "archive_folders_select_members"
on public.archive_folders
for select
to authenticated
using (
  owner_user_id = auth.uid()
  or (
    space_id is not null
    and public.can_access_shared_archive_space(space_id)
  )
);

drop policy if exists "archive_folders_insert_members" on public.archive_folders;
create policy "archive_folders_insert_members"
on public.archive_folders
for insert
to authenticated
with check (
  coalesce(created_by_user_id, auth.uid()) = auth.uid()
  and is_system_default = false
  and (
    (
      owner_user_id = auth.uid()
      and space_id is null
    )
    or (
      owner_user_id is null
      and space_id is not null
      and public.can_access_shared_archive_space(space_id)
    )
  )
  and (
    parent_id is null
    or public.can_access_archive_folder(parent_id)
  )
);

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
  is_system_default = false
  and (
    (
      owner_user_id = auth.uid()
      and space_id is null
    )
    or (
      owner_user_id is null
      and space_id is not null
      and public.can_access_shared_archive_space(space_id)
    )
  )
  and (
    parent_id is null
    or public.can_access_archive_folder(parent_id)
  )
);

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
  (
    owner_user_id = auth.uid()
    or public.can_access_shared_archive_space(space_id)
  )
  and public.can_access_work_order(original_work_order_id)
);

drop policy if exists "archived_work_orders_insert_members" on public.archived_work_orders;
create policy "archived_work_orders_insert_members"
on public.archived_work_orders
for insert
to authenticated
with check (
  public.can_access_work_order(original_work_order_id)
  and public.has_work_order_permission(original_work_order_id, 'archive_work_order')
  and archived_by_user_id = auth.uid()
  and immutable = true
  and status_snapshot = 'archived'::public.work_order_status
  and (
    owner_user_id = auth.uid()
    or public.can_access_shared_archive_space(space_id)
  )
  and exists (
    select 1
    from public.archive_folders
    where archive_folders.id = archived_work_orders.archive_folder_id
      and (
        archive_folders.owner_user_id = auth.uid()
        or (
          archive_folders.space_id is not null
          and archive_folders.space_id = archived_work_orders.space_id
          and public.can_access_shared_archive_space(archive_folders.space_id)
        )
      )
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
  (
    owner_user_id = auth.uid()
    or public.can_access_shared_archive_space(space_id)
  )
  and public.can_access_work_order(original_work_order_id)
)
with check (
  immutable = true
  and (
    owner_user_id = auth.uid()
    or public.can_access_shared_archive_space(space_id)
  )
  and public.can_access_work_order(original_work_order_id)
  and exists (
    select 1
    from public.archive_folders
    where archive_folders.id = archived_work_orders.archive_folder_id
      and (
        archive_folders.owner_user_id = auth.uid()
        or (
          archive_folders.space_id is not null
          and archive_folders.space_id = archived_work_orders.space_id
          and public.can_access_shared_archive_space(archive_folders.space_id)
        )
      )
  )
);

drop policy if exists "archived_work_orders_delete_owner" on public.archived_work_orders;
create policy "archived_work_orders_delete_owner"
on public.archived_work_orders
for delete
to authenticated
using (
  owner_user_id = auth.uid()
  or public.can_access_shared_archive_space(space_id)
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
