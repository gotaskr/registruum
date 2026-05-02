-- Ensure Officer / Coordinator can invite on work orders (seed + existing rows).
-- Hosted projects that already applied 202604061631 will not re-run edits to that file; this migration applies the change safely.

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
      ('officer_coordinator'::public.app_role, 'invite_people'),
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

update public.work_order_role_permissions
set
  is_allowed = true,
  updated_at = timezone('utc', now())
where role = 'officer_coordinator'::public.app_role
  and permission_key = 'invite_people';
