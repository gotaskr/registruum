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
          array['admin'::public.app_role, 'manager'::public.app_role]
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
  select exists (
    select 1
    from public.work_orders
    where id = target_work_order_id
      and status in ('open', 'in_progress')
      and public.has_space_role(
        space_id,
        array['admin'::public.app_role, 'manager'::public.app_role]
      )
  );
$$;

create or replace function public.can_collaborate_on_work_order(target_work_order_id uuid)
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
      and status in ('open', 'in_progress')
      and public.can_access_work_order(id)
  );
$$;

create or replace function public.can_upload_work_order_document(target_work_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_manage_work_order(target_work_order_id);
$$;

create or replace function public.can_upload_work_order_message_file(target_work_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_collaborate_on_work_order(target_work_order_id);
$$;

create or replace function public.storage_object_space_id(object_name text)
returns uuid
language sql
immutable
as $$
  select nullif(split_part(object_name, '/', 2), '')::uuid;
$$;

create or replace function public.storage_object_work_order_id(object_name text)
returns uuid
language sql
immutable
as $$
  select case
    when split_part(object_name, '/', 3) = 'work-orders'
      then nullif(split_part(object_name, '/', 4), '')::uuid
    else null
  end;
$$;

create or replace function public.storage_object_category(object_name text)
returns text
language sql
immutable
as $$
  select nullif(split_part(object_name, '/', 5), '');
$$;

create or replace function public.can_access_storage_object(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when public.storage_object_work_order_id(object_name) is not null
      then public.can_access_work_order(public.storage_object_work_order_id(object_name))
    else public.is_space_member(public.storage_object_space_id(object_name))
  end;
$$;

create or replace function public.can_write_storage_object(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case public.storage_object_category(object_name)
    when 'documents'
      then public.can_upload_work_order_document(
        public.storage_object_work_order_id(object_name)
      )
    when 'messages'
      then public.can_upload_work_order_message_file(
        public.storage_object_work_order_id(object_name)
      )
    else false
  end;
$$;

create or replace function public.enforce_work_order_write_rules()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.status in ('completed', 'archived') then
    raise exception 'Completed or archived work orders are read-only.';
  end if;

  if new.status in ('completed', 'archived')
     and not public.has_space_role(
       new.space_id,
       array['admin'::public.app_role]
     ) then
    raise exception 'Only admins can mark work orders completed or archived.';
  end if;

  return new;
end;
$$;

drop trigger if exists before_work_order_write_rules on public.work_orders;
create trigger before_work_order_write_rules
before update on public.work_orders
for each row
execute function public.enforce_work_order_write_rules();
