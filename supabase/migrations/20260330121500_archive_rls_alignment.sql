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
  );
$$;

create or replace function public.can_access_archive_folder(target_folder_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.can_access_archive()
    and exists (
      select 1
      from public.archive_folders
      where archive_folders.id = target_folder_id
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
      and public.can_access_work_order(archived_work_orders.original_work_order_id)
  );
$$;

drop policy if exists "archive_folders_select_authenticated" on public.archive_folders;
drop policy if exists "archive_folders_select_members" on public.archive_folders;
create policy "archive_folders_select_members"
on public.archive_folders
for select
to authenticated
using (public.can_access_archive());

drop policy if exists "archive_folders_insert_authenticated" on public.archive_folders;
drop policy if exists "archive_folders_insert_members" on public.archive_folders;
create policy "archive_folders_insert_members"
on public.archive_folders
for insert
to authenticated
with check (
  public.can_access_archive()
  and coalesce(created_by_user_id, auth.uid()) = auth.uid()
  and is_system_default = false
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
  public.can_access_archive()
  and is_system_default = false
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
using (public.can_access_work_order(original_work_order_id));

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
using (public.can_access_work_order(original_work_order_id))
with check (
  public.can_access_work_order(original_work_order_id)
  and immutable = true
);

drop policy if exists "archive_activity_logs_select_members" on public.archive_activity_logs;
create policy "archive_activity_logs_select_members"
on public.archive_activity_logs
for select
to authenticated
using (
  archived_work_order_id is null
  or public.can_access_archived_work_order(archived_work_order_id)
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

create or replace function public.enforce_archived_work_order_write_rules()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.immutable is distinct from true then
      raise exception 'Archived work orders must remain immutable.';
    end if;

    if new.status_snapshot <> 'archived'::public.work_order_status then
      raise exception 'Archived work orders must keep an archived status snapshot.';
    end if;

    return new;
  end if;

  if (
    to_jsonb(new) - array['archive_folder_id', 'updated_at']
  ) is distinct from (
    to_jsonb(old) - array['archive_folder_id', 'updated_at']
  ) then
    raise exception 'Archived work orders are immutable.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_archived_work_order_write_rules on public.archived_work_orders;
create trigger enforce_archived_work_order_write_rules
before insert or update on public.archived_work_orders
for each row
execute function public.enforce_archived_work_order_write_rules();
