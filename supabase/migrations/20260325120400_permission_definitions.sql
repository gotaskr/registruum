create table if not exists public.permission_definitions (
  key text primary key,
  scope public.permission_scope not null,
  description text not null,
  is_system_locked boolean not null default false,
  default_admin boolean not null default false,
  default_manager boolean not null default false,
  default_contractor boolean not null default false,
  default_member boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

insert into public.permission_definitions (
  key,
  scope,
  description,
  is_system_locked,
  default_admin,
  default_manager,
  default_contractor,
  default_member
)
values
  ('space.rename', 'space', 'Rename a space.', true, true, true, false, false),
  ('membership.manage', 'membership', 'Add, update, and remove space memberships.', true, true, false, false, false),
  ('work_order.create', 'work_order', 'Create work orders inside a space.', false, true, true, false, false),
  ('work_order.edit', 'work_order', 'Edit open and in-progress work orders.', false, true, true, true, false),
  ('work_order.archive', 'work_order', 'Move work orders into archived state.', false, true, true, false, false),
  ('work_order.assign_members', 'work_order', 'Assign work order participants.', false, true, true, true, false),
  ('document.manage', 'document', 'Create and rename folders and documents.', false, true, true, false, false),
  ('document.read', 'document', 'View folders and documents.', true, true, true, true, true),
  ('job_market.post', 'job_market', 'Post open work orders to the job market.', false, true, true, false, false),
  ('invite.manage', 'invite', 'Create and revoke invites.', false, true, false, false, false)
on conflict (key) do update
set
  scope = excluded.scope,
  description = excluded.description,
  is_system_locked = excluded.is_system_locked,
  default_admin = excluded.default_admin,
  default_manager = excluded.default_manager,
  default_contractor = excluded.default_contractor,
  default_member = excluded.default_member;
