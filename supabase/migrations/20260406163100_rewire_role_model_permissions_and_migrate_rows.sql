update public.space_memberships
set role = case
  when role in ('member'::public.app_role, 'viewer'::public.app_role) then 'worker'::public.app_role
  else role
end
where role in ('member'::public.app_role, 'viewer'::public.app_role);

update public.work_order_memberships
set role = case
  when role in ('member'::public.app_role, 'viewer'::public.app_role) then 'worker'::public.app_role
  else role
end
where role in ('member'::public.app_role, 'viewer'::public.app_role);

update public.invites
set role = case
  when role in ('member'::public.app_role, 'viewer'::public.app_role) then 'worker'::public.app_role
  else role
end
where role in ('member'::public.app_role, 'viewer'::public.app_role);

insert into public.space_role_permissions (
  space_id,
  role,
  permission_key,
  is_allowed,
  created_at,
  updated_at
)
select
  space_id,
  'worker'::public.app_role,
  permission_key,
  bool_or(is_allowed),
  min(created_at),
  max(updated_at)
from public.space_role_permissions
where role in ('member'::public.app_role, 'viewer'::public.app_role)
group by space_id, permission_key
on conflict (space_id, role, permission_key) do update
set
  is_allowed = excluded.is_allowed,
  updated_at = timezone('utc', now());

delete from public.space_role_permissions
where role in ('member'::public.app_role, 'viewer'::public.app_role);

delete from public.work_order_role_permissions;

alter table public.work_order_role_permissions
  drop constraint if exists work_order_role_permissions_role_check;

alter table public.work_order_role_permissions
  add constraint work_order_role_permissions_role_check
  check (
    role in (
      'admin'::public.app_role,
      'operations_manager'::public.app_role,
      'manager'::public.app_role,
      'officer_coordinator'::public.app_role,
      'field_lead_superintendent'::public.app_role,
      'helper'::public.app_role,
      'contractor'::public.app_role,
      'worker'::public.app_role
    )
  );

create or replace function public.seed_default_role_permissions(target_space_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.space_role_permissions (
    space_id,
    role,
    permission_key,
    is_allowed
  )
  select
    target_space_id,
    role_matrix.role,
    permission_definition.key,
    case role_matrix.role
      when 'admin'::public.app_role then permission_definition.default_admin
      when 'operations_manager'::public.app_role then permission_definition.default_manager
      when 'manager'::public.app_role then permission_definition.default_manager
      when 'field_lead_superintendent'::public.app_role then permission_definition.default_contractor
      when 'contractor'::public.app_role then permission_definition.default_contractor
      when 'officer_coordinator'::public.app_role then permission_definition.default_member
      when 'helper'::public.app_role then permission_definition.default_member
      when 'worker'::public.app_role then permission_definition.default_member
      else false
    end as is_allowed
  from public.permission_definitions as permission_definition
  cross join (
    values
      ('admin'::public.app_role),
      ('operations_manager'::public.app_role),
      ('manager'::public.app_role),
      ('officer_coordinator'::public.app_role),
      ('field_lead_superintendent'::public.app_role),
      ('helper'::public.app_role),
      ('contractor'::public.app_role),
      ('worker'::public.app_role)
  ) as role_matrix(role)
  on conflict (space_id, role, permission_key) do update
  set
    is_allowed = excluded.is_allowed,
    updated_at = timezone('utc', now());
end;
$$;

create or replace function public.seed_default_work_order_role_permissions(target_work_order_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  with role_matrix(role) as (
    values
      ('admin'::public.app_role),
      ('operations_manager'::public.app_role),
      ('manager'::public.app_role),
      ('officer_coordinator'::public.app_role),
      ('field_lead_superintendent'::public.app_role),
      ('helper'::public.app_role),
      ('contractor'::public.app_role),
      ('worker'::public.app_role)
  ),
  allowed(role, permission_key) as (
    values
      ('admin'::public.app_role, 'edit_work_order'),
      ('admin'::public.app_role, 'change_work_order_status'),
      ('admin'::public.app_role, 'archive_work_order'),
      ('admin'::public.app_role, 'reopen_work_order'),
      ('admin'::public.app_role, 'delete_work_order'),
      ('admin'::public.app_role, 'invite_people'),
      ('admin'::public.app_role, 'remove_people'),
      ('admin'::public.app_role, 'change_member_roles'),
      ('admin'::public.app_role, 'upload_files'),
      ('admin'::public.app_role, 'delete_own_files'),
      ('admin'::public.app_role, 'delete_any_files'),
      ('admin'::public.app_role, 'download_files'),
      ('admin'::public.app_role, 'send_messages'),
      ('admin'::public.app_role, 'edit_own_messages'),
      ('admin'::public.app_role, 'delete_own_messages'),
      ('admin'::public.app_role, 'delete_any_message'),
      ('admin'::public.app_role, 'view_logs'),
      ('admin'::public.app_role, 'manage_work_order_settings'),
      ('admin'::public.app_role, 'manage_permissions'),
      ('operations_manager'::public.app_role, 'edit_work_order'),
      ('operations_manager'::public.app_role, 'change_work_order_status'),
      ('operations_manager'::public.app_role, 'archive_work_order'),
      ('operations_manager'::public.app_role, 'reopen_work_order'),
      ('operations_manager'::public.app_role, 'delete_work_order'),
      ('operations_manager'::public.app_role, 'invite_people'),
      ('operations_manager'::public.app_role, 'remove_people'),
      ('operations_manager'::public.app_role, 'change_member_roles'),
      ('operations_manager'::public.app_role, 'upload_files'),
      ('operations_manager'::public.app_role, 'delete_own_files'),
      ('operations_manager'::public.app_role, 'delete_any_files'),
      ('operations_manager'::public.app_role, 'download_files'),
      ('operations_manager'::public.app_role, 'send_messages'),
      ('operations_manager'::public.app_role, 'edit_own_messages'),
      ('operations_manager'::public.app_role, 'delete_own_messages'),
      ('operations_manager'::public.app_role, 'delete_any_message'),
      ('operations_manager'::public.app_role, 'view_logs'),
      ('operations_manager'::public.app_role, 'manage_work_order_settings'),
      ('manager'::public.app_role, 'edit_work_order'),
      ('manager'::public.app_role, 'change_work_order_status'),
      ('manager'::public.app_role, 'archive_work_order'),
      ('manager'::public.app_role, 'reopen_work_order'),
      ('manager'::public.app_role, 'delete_work_order'),
      ('manager'::public.app_role, 'invite_people'),
      ('manager'::public.app_role, 'remove_people'),
      ('manager'::public.app_role, 'change_member_roles'),
      ('manager'::public.app_role, 'upload_files'),
      ('manager'::public.app_role, 'delete_own_files'),
      ('manager'::public.app_role, 'delete_any_files'),
      ('manager'::public.app_role, 'download_files'),
      ('manager'::public.app_role, 'send_messages'),
      ('manager'::public.app_role, 'edit_own_messages'),
      ('manager'::public.app_role, 'delete_own_messages'),
      ('manager'::public.app_role, 'delete_any_message'),
      ('manager'::public.app_role, 'view_logs'),
      ('manager'::public.app_role, 'manage_work_order_settings'),
      ('officer_coordinator'::public.app_role, 'download_files'),
      ('officer_coordinator'::public.app_role, 'send_messages'),
      ('officer_coordinator'::public.app_role, 'edit_own_messages'),
      ('officer_coordinator'::public.app_role, 'delete_own_messages'),
      ('officer_coordinator'::public.app_role, 'view_logs'),
      ('field_lead_superintendent'::public.app_role, 'edit_work_order'),
      ('field_lead_superintendent'::public.app_role, 'change_work_order_status'),
      ('field_lead_superintendent'::public.app_role, 'archive_work_order'),
      ('field_lead_superintendent'::public.app_role, 'reopen_work_order'),
      ('field_lead_superintendent'::public.app_role, 'delete_work_order'),
      ('field_lead_superintendent'::public.app_role, 'invite_people'),
      ('field_lead_superintendent'::public.app_role, 'remove_people'),
      ('field_lead_superintendent'::public.app_role, 'change_member_roles'),
      ('field_lead_superintendent'::public.app_role, 'upload_files'),
      ('field_lead_superintendent'::public.app_role, 'delete_own_files'),
      ('field_lead_superintendent'::public.app_role, 'delete_any_files'),
      ('field_lead_superintendent'::public.app_role, 'download_files'),
      ('field_lead_superintendent'::public.app_role, 'send_messages'),
      ('field_lead_superintendent'::public.app_role, 'edit_own_messages'),
      ('field_lead_superintendent'::public.app_role, 'delete_own_messages'),
      ('field_lead_superintendent'::public.app_role, 'delete_any_message'),
      ('field_lead_superintendent'::public.app_role, 'view_logs'),
      ('field_lead_superintendent'::public.app_role, 'manage_work_order_settings'),
      ('helper'::public.app_role, 'download_files'),
      ('helper'::public.app_role, 'send_messages'),
      ('helper'::public.app_role, 'edit_own_messages'),
      ('helper'::public.app_role, 'delete_own_messages'),
      ('helper'::public.app_role, 'view_logs'),
      ('contractor'::public.app_role, 'invite_people'),
      ('contractor'::public.app_role, 'download_files'),
      ('contractor'::public.app_role, 'send_messages'),
      ('contractor'::public.app_role, 'edit_own_messages'),
      ('contractor'::public.app_role, 'delete_own_messages'),
      ('contractor'::public.app_role, 'view_logs'),
      ('worker'::public.app_role, 'download_files'),
      ('worker'::public.app_role, 'send_messages'),
      ('worker'::public.app_role, 'edit_own_messages'),
      ('worker'::public.app_role, 'delete_own_messages'),
      ('worker'::public.app_role, 'view_logs')
  )
  insert into public.work_order_role_permissions (
    work_order_id,
    role,
    permission_key,
    is_allowed
  )
  select
    target_work_order_id,
    role_matrix.role,
    permission_definition.key,
    exists (
      select 1
      from allowed
      where allowed.role = role_matrix.role
        and allowed.permission_key = permission_definition.key
    )
  from public.work_order_permission_definitions as permission_definition
  cross join role_matrix
  on conflict (work_order_id, role, permission_key) do update
  set
    is_allowed = excluded.is_allowed,
    updated_at = timezone('utc', now());
$$;

select public.seed_default_role_permissions(id)
from public.spaces;

select public.seed_default_work_order_role_permissions(id)
from public.work_orders;

create or replace function public.can_access_work_order(target_work_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.work_orders
    where id = target_work_order_id
      and (
        public.has_space_role(
          space_id,
          array[
            'admin'::public.app_role,
            'operations_manager'::public.app_role,
            'manager'::public.app_role
          ]
        )
        or exists (
          select 1
          from public.work_order_memberships
          where work_order_id = target_work_order_id
            and user_id = auth.uid()
        )
      )
  );
$$;

create or replace function public.can_manage_work_order(target_work_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.has_work_order_permission(target_work_order_id, 'manage_work_order_settings')
    or public.has_work_order_permission(target_work_order_id, 'change_work_order_status')
    or public.has_work_order_permission(target_work_order_id, 'archive_work_order')
    or public.has_work_order_permission(target_work_order_id, 'reopen_work_order')
    or public.has_work_order_permission(target_work_order_id, 'delete_work_order');
$$;

create or replace function public.can_collaborate_on_work_order(target_work_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.can_access_work_order(target_work_order_id)
    and public.has_work_order_permission(target_work_order_id, 'send_messages');
$$;

create or replace function public.can_upload_work_order_document(target_work_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_work_order_permission(target_work_order_id, 'upload_files');
$$;

create or replace function public.can_upload_work_order_message_file(target_work_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_work_order_permission(target_work_order_id, 'send_messages');
$$;

create or replace function public.has_work_order_permission(
  target_work_order_id uuid,
  target_permission_key text
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  target_space_id uuid;
  target_owner_user_id uuid;
  actor_space_role public.app_role;
  actor_work_order_role public.app_role;
  resolved_role public.app_role;
  has_permission boolean;
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role' then
    return true;
  end if;

  if auth.uid() is null then
    return false;
  end if;

  select space_id, owner_user_id
  into target_space_id, target_owner_user_id
  from public.work_orders
  where id = target_work_order_id;

  if target_space_id is null then
    return false;
  end if;

  select role
  into actor_space_role
  from public.space_memberships
  where space_id = target_space_id
    and user_id = auth.uid()
    and status = 'active'
  limit 1;

  if actor_space_role is null then
    return false;
  end if;

  if actor_space_role = 'admin'::public.app_role then
    return true;
  end if;

  if actor_space_role in (
    'operations_manager'::public.app_role,
    'manager'::public.app_role
  ) then
    resolved_role := actor_space_role;
  elsif target_owner_user_id = auth.uid() then
    return true;
  else
    select role
    into actor_work_order_role
    from public.work_order_memberships
    where work_order_id = target_work_order_id
      and user_id = auth.uid()
    limit 1;

    if actor_work_order_role in (
      'officer_coordinator'::public.app_role,
      'field_lead_superintendent'::public.app_role,
      'helper'::public.app_role,
      'contractor'::public.app_role,
      'worker'::public.app_role
    ) then
      resolved_role := actor_work_order_role;
    else
      return false;
    end if;
  end if;

  select is_allowed
  into has_permission
  from public.work_order_role_permissions
  where work_order_id = target_work_order_id
    and role = resolved_role
    and permission_key = target_permission_key
  limit 1;

  return coalesce(has_permission, false);
end;
$$;

create or replace function public.can_update_work_order(target_work_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.has_work_order_permission(target_work_order_id, 'manage_work_order_settings')
    or public.has_work_order_permission(target_work_order_id, 'change_work_order_status')
    or public.has_work_order_permission(target_work_order_id, 'archive_work_order')
    or public.has_work_order_permission(target_work_order_id, 'reopen_work_order');
$$;

drop policy if exists "work_orders_insert_members" on public.work_orders;
create policy "work_orders_insert_members"
on public.work_orders
for insert
to authenticated
with check (
  created_by_user_id = auth.uid()
  and public.has_space_role(
    space_id,
    array[
      'admin'::public.app_role,
      'operations_manager'::public.app_role,
      'manager'::public.app_role
    ]
  )
);

drop policy if exists "work_orders_delete_admins" on public.work_orders;
create policy "work_orders_delete_admins"
on public.work_orders
for delete
to authenticated
using (
  status in ('open', 'in_progress', 'on_hold')
  and public.has_work_order_permission(id, 'delete_work_order')
);
