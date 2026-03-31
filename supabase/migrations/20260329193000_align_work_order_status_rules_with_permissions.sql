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

  if target_owner_user_id = auth.uid() then
    return true;
  end if;

  select role
  into actor_work_order_role
  from public.work_order_memberships
  where work_order_id = target_work_order_id
    and user_id = auth.uid()
  limit 1;

  if actor_work_order_role = 'manager'::public.app_role then
    resolved_role := 'manager'::public.app_role;
  elsif actor_work_order_role in ('member'::public.app_role, 'contractor'::public.app_role) then
    resolved_role := 'member'::public.app_role;
  else
    return false;
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

  if settings_changed then
    if old.status = 'archived'::public.work_order_status then
      raise exception 'Archived work orders are read-only until reopened.';
    end if;

    if not public.has_work_order_permission(old.id, 'manage_work_order_settings') then
      raise exception 'You cannot edit this work order.';
    end if;
  end if;

  if status_changed then
    if new.status = 'archived'::public.work_order_status then
      if not public.has_work_order_permission(old.id, 'archive_work_order') then
        raise exception 'You cannot archive this work order.';
      end if;
    elsif old.status in ('completed'::public.work_order_status, 'archived'::public.work_order_status) then
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

drop policy if exists "work_orders_update_open_states" on public.work_orders;
create policy "work_orders_update_open_states"
on public.work_orders
for update
to authenticated
using (public.can_update_work_order(id))
with check (public.is_space_member(space_id));
