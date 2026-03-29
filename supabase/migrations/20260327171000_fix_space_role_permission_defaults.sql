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
      when 'manager'::public.app_role then permission_definition.default_manager
      when 'contractor'::public.app_role then permission_definition.default_contractor
      when 'member'::public.app_role then permission_definition.default_member
      else false
    end as is_allowed
  from public.permission_definitions as permission_definition
  cross join (
    select unnest(enum_range(null::public.app_role)) as role
  ) as role_matrix
  on conflict (space_id, role, permission_key) do update
  set
    is_allowed = excluded.is_allowed,
    updated_at = timezone('utc', now());
end;
$$;

insert into public.space_role_permissions (
  space_id,
  role,
  permission_key,
  is_allowed
)
select
  spaces.id,
  'viewer'::public.app_role,
  permission_definition.key,
  false
from public.spaces as spaces
cross join public.permission_definitions as permission_definition
on conflict (space_id, role, permission_key) do update
set
  is_allowed = excluded.is_allowed,
  updated_at = timezone('utc', now());
