update public.invites
set role = 'field_lead_superintendent'::public.app_role
where status = 'pending'
  and method in ('link', 'code')
  and coalesce(array_length(assigned_work_order_ids, 1), 0) = 0
  and role = 'manager'::public.app_role;

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
      when 'field_lead_superintendent'::public.app_role then permission_definition.default_member
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
  elsif actor_space_role = 'field_lead_superintendent'::public.app_role then
    if exists (
      select 1
      from public.work_order_memberships
      where work_order_id = target_work_order_id
        and user_id = auth.uid()
    ) then
      resolved_role := 'field_lead_superintendent'::public.app_role;
    elsif target_owner_user_id = auth.uid() then
      return true;
    else
      return false;
    end if;
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

select public.seed_default_role_permissions(id)
from public.spaces;
