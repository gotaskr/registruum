drop policy if exists "spaces_delete_admins" on public.spaces;
create policy "spaces_delete_admins"
on public.spaces
for delete
to authenticated
using (public.has_space_role(id, array['admin'::public.app_role]));

drop policy if exists "archived_work_orders_delete_admins" on public.archived_work_orders;
create policy "archived_work_orders_delete_admins"
on public.archived_work_orders
for delete
to authenticated
using (public.has_space_role(space_id, array['admin'::public.app_role]));

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
    if old.status in ('completed'::public.work_order_status, 'archived'::public.work_order_status) then
      raise exception 'Completed and archived work orders are read-only until reopened.';
    end if;

    if not public.has_work_order_permission(old.id, 'manage_work_order_settings') then
      raise exception 'You cannot edit this work order.';
    end if;
  end if;

  if status_changed then
    if old.status = 'archived'::public.work_order_status then
      if not public.has_work_order_permission(old.id, 'reopen_work_order') then
        raise exception 'You cannot reopen this work order.';
      end if;
    elsif old.status = 'completed'::public.work_order_status then
      if new.status = 'archived'::public.work_order_status then
        if not public.has_work_order_permission(old.id, 'archive_work_order') then
          raise exception 'You cannot archive this work order.';
        end if;
      elsif not public.has_work_order_permission(old.id, 'reopen_work_order') then
        raise exception 'You cannot reopen this work order.';
      end if;
    elsif new.status = 'archived'::public.work_order_status then
      if not public.has_work_order_permission(old.id, 'archive_work_order') then
        raise exception 'You cannot archive this work order.';
      end if;
    elsif not public.has_work_order_permission(old.id, 'change_work_order_status') then
      raise exception 'You cannot change the lifecycle status for this work order.';
    end if;
  end if;

  return new;
end;
$$;
