alter type public.work_order_status add value if not exists 'on_hold';

alter table public.work_orders
  add column if not exists priority text not null default 'medium',
  add column if not exists start_date date,
  add column if not exists due_date date,
  add column if not exists owner_user_id uuid references public.profiles(id) on delete set null,
  add column if not exists vendor_name text,
  add column if not exists auto_save_chat_attachments boolean not null default true,
  add column if not exists allow_document_deletion_in_progress boolean not null default true,
  add column if not exists lock_documents_on_completed boolean not null default true;

update public.work_orders
set
  owner_user_id = coalesce(owner_user_id, created_by_user_id),
  due_date = coalesce(due_date, expiration_at)
where owner_user_id is null
   or (due_date is null and expiration_at is not null);

alter table public.work_orders
  alter column owner_user_id set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'work_orders_priority_check'
  ) then
    alter table public.work_orders
      add constraint work_orders_priority_check
      check (priority in ('low', 'medium', 'high', 'urgent'));
  end if;
end $$;

create table if not exists public.work_order_permission_definitions (
  key text primary key,
  group_name text not null,
  label text not null,
  description text,
  is_sensitive boolean not null default false,
  default_admin boolean not null default false,
  default_manager boolean not null default false,
  default_member boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

insert into public.work_order_permission_definitions (
  key,
  group_name,
  label,
  description,
  is_sensitive,
  default_admin,
  default_manager,
  default_member
)
values
  ('edit_work_order', 'Work Order', 'Edit work order', 'Update title, type, location, and core details.', false, true, true, false),
  ('change_work_order_status', 'Work Order', 'Change work order status', 'Move the work order between active lifecycle states.', false, true, true, false),
  ('archive_work_order', 'Work Order', 'Archive work order', 'Move the work order into an archived record state.', false, true, false, false),
  ('reopen_work_order', 'Work Order', 'Reopen work order', 'Reopen completed or archived work orders.', false, true, false, false),
  ('delete_work_order', 'Work Order', 'Delete work order', 'Permanently remove the work order record.', true, true, false, false),
  ('invite_people', 'Members', 'Invite people', 'Invite or add members into the work order.', false, true, true, false),
  ('remove_people', 'Members', 'Remove people', 'Remove members from the work order.', true, true, false, false),
  ('change_member_roles', 'Members', 'Change member roles', 'Adjust operational work order roles.', false, true, false, false),
  ('upload_files', 'Documents', 'Upload files', 'Upload photos, videos, files, and links.', false, true, true, true),
  ('delete_own_files', 'Documents', 'Delete own files', 'Delete files uploaded by the same user.', false, true, true, false),
  ('delete_any_files', 'Documents', 'Delete any files', 'Delete any file attached to the work order.', false, true, true, false),
  ('download_files', 'Documents', 'Download files', 'Download work order documents.', false, true, true, true),
  ('send_messages', 'Chat', 'Send messages', 'Send messages in the work order chat.', false, true, true, true),
  ('edit_own_messages', 'Chat', 'Edit own messages', 'Edit messages sent by the same user.', false, true, true, true),
  ('delete_own_messages', 'Chat', 'Delete own messages', 'Delete messages sent by the same user.', false, true, true, true),
  ('delete_any_message', 'Chat', 'Delete any message', 'Delete any work order message.', false, true, false, false),
  ('view_logs', 'Records / Settings', 'View logs', 'Review work order audit logs.', false, true, true, false),
  ('manage_work_order_settings', 'Records / Settings', 'Manage work order settings', 'Update lifecycle, assignment, and document rules.', false, true, true, false),
  ('manage_permissions', 'Records / Settings', 'Manage permissions', 'Change permissions for admin, manager, and member roles.', true, true, false, false)
on conflict (key) do update
set
  group_name = excluded.group_name,
  label = excluded.label,
  description = excluded.description,
  is_sensitive = excluded.is_sensitive,
  default_admin = excluded.default_admin,
  default_manager = excluded.default_manager,
  default_member = excluded.default_member;

create table if not exists public.work_order_role_permissions (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  role public.app_role not null,
  permission_key text not null references public.work_order_permission_definitions(key) on delete cascade,
  is_allowed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (work_order_id, role, permission_key),
  constraint work_order_role_permissions_role_check
    check (role in ('admin'::public.app_role, 'manager'::public.app_role, 'member'::public.app_role))
);

create index if not exists work_order_role_permissions_work_order_role_idx
  on public.work_order_role_permissions (work_order_id, role);

create or replace function public.seed_default_work_order_role_permissions(target_work_order_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
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
    case role_matrix.role
      when 'admin'::public.app_role then permission_definition.default_admin
      when 'manager'::public.app_role then permission_definition.default_manager
      when 'member'::public.app_role then permission_definition.default_member
      else false
    end
  from public.work_order_permission_definitions as permission_definition
  cross join (
    values
      ('admin'::public.app_role),
      ('manager'::public.app_role),
      ('member'::public.app_role)
  ) as role_matrix(role)
  on conflict (work_order_id, role, permission_key) do nothing;
$$;

create or replace function public.handle_work_order_role_permissions_seed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.seed_default_work_order_role_permissions(new.id);
  return new;
end;
$$;

insert into public.work_order_role_permissions (
  work_order_id,
  role,
  permission_key,
  is_allowed
)
select
  work_order.id,
  role_matrix.role,
  permission_definition.key,
  case role_matrix.role
    when 'admin'::public.app_role then permission_definition.default_admin
    when 'manager'::public.app_role then permission_definition.default_manager
    when 'member'::public.app_role then permission_definition.default_member
    else false
  end
from public.work_orders as work_order
cross join public.work_order_permission_definitions as permission_definition
cross join (
  values
    ('admin'::public.app_role),
    ('manager'::public.app_role),
    ('member'::public.app_role)
) as role_matrix(role)
on conflict (work_order_id, role, permission_key) do nothing;

alter table public.work_order_permission_definitions enable row level security;
alter table public.work_order_role_permissions enable row level security;

drop policy if exists "work_order_permission_definitions_select_authenticated" on public.work_order_permission_definitions;
create policy "work_order_permission_definitions_select_authenticated"
on public.work_order_permission_definitions
for select
to authenticated
using (true);

drop policy if exists "work_order_role_permissions_select_members" on public.work_order_role_permissions;
create policy "work_order_role_permissions_select_members"
on public.work_order_role_permissions
for select
to authenticated
using (public.can_access_work_order(work_order_id));

drop policy if exists "work_order_role_permissions_insert_admins" on public.work_order_role_permissions;
create policy "work_order_role_permissions_insert_admins"
on public.work_order_role_permissions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.work_orders
    where id = work_order_id
      and public.has_space_role(space_id, array['admin'::public.app_role])
  )
);

drop policy if exists "work_order_role_permissions_update_admins" on public.work_order_role_permissions;
create policy "work_order_role_permissions_update_admins"
on public.work_order_role_permissions
for update
to authenticated
using (
  exists (
    select 1
    from public.work_orders
    where id = work_order_id
      and public.has_space_role(space_id, array['admin'::public.app_role])
  )
)
with check (
  exists (
    select 1
    from public.work_orders
    where id = work_order_id
      and public.has_space_role(space_id, array['admin'::public.app_role])
  )
);

drop policy if exists "work_order_role_permissions_delete_admins" on public.work_order_role_permissions;
create policy "work_order_role_permissions_delete_admins"
on public.work_order_role_permissions
for delete
to authenticated
using (
  exists (
    select 1
    from public.work_orders
    where id = work_order_id
      and public.has_space_role(space_id, array['admin'::public.app_role])
  )
);

drop trigger if exists set_work_order_role_permissions_updated_at on public.work_order_role_permissions;
create trigger set_work_order_role_permissions_updated_at
before update on public.work_order_role_permissions
for each row
execute function public.set_updated_at();

drop trigger if exists on_work_order_created_seed_role_permissions on public.work_orders;
create trigger on_work_order_created_seed_role_permissions
after insert on public.work_orders
for each row
execute function public.handle_work_order_role_permissions_seed();
