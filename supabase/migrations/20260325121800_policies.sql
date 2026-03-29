alter table public.profiles enable row level security;
alter table public.spaces enable row level security;
alter table public.space_memberships enable row level security;
alter table public.permission_definitions enable row level security;
alter table public.space_role_permissions enable row level security;
alter table public.work_orders enable row level security;
alter table public.work_order_memberships enable row level security;
alter table public.job_market_posts enable row level security;
alter table public.document_folders enable row level security;
alter table public.documents enable row level security;
alter table public.work_order_messages enable row level security;
alter table public.work_order_message_attachments enable row level security;
alter table public.activity_logs enable row level security;
alter table public.invites enable row level security;

drop policy if exists "profiles_select_self_or_shared_space" on public.profiles;
create policy "profiles_select_self_or_shared_space"
on public.profiles
for select
to authenticated
using (public.shares_space_with_profile(id));

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "spaces_select_members" on public.spaces;
create policy "spaces_select_members"
on public.spaces
for select
to authenticated
using (public.is_space_member(id));

drop policy if exists "spaces_insert_creator" on public.spaces;
create policy "spaces_insert_creator"
on public.spaces
for insert
to authenticated
with check (auth.uid() = created_by_user_id);

drop policy if exists "spaces_update_admins" on public.spaces;
create policy "spaces_update_admins"
on public.spaces
for update
to authenticated
using (public.has_space_role(id, array['admin'::public.app_role]))
with check (public.has_space_role(id, array['admin'::public.app_role]));

drop policy if exists "space_memberships_select_members" on public.space_memberships;
create policy "space_memberships_select_members"
on public.space_memberships
for select
to authenticated
using (public.is_space_member(space_id));

drop policy if exists "space_memberships_insert_admins" on public.space_memberships;
create policy "space_memberships_insert_admins"
on public.space_memberships
for insert
to authenticated
with check (public.has_space_role(space_id, array['admin'::public.app_role]));

drop policy if exists "space_memberships_update_admins" on public.space_memberships;
create policy "space_memberships_update_admins"
on public.space_memberships
for update
to authenticated
using (public.has_space_role(space_id, array['admin'::public.app_role]))
with check (public.has_space_role(space_id, array['admin'::public.app_role]));

drop policy if exists "space_memberships_delete_admins" on public.space_memberships;
create policy "space_memberships_delete_admins"
on public.space_memberships
for delete
to authenticated
using (public.has_space_role(space_id, array['admin'::public.app_role]));

drop policy if exists "permission_definitions_select_authenticated" on public.permission_definitions;
create policy "permission_definitions_select_authenticated"
on public.permission_definitions
for select
to authenticated
using (true);

drop policy if exists "space_role_permissions_select_members" on public.space_role_permissions;
create policy "space_role_permissions_select_members"
on public.space_role_permissions
for select
to authenticated
using (public.is_space_member(space_id));

drop policy if exists "space_role_permissions_insert_admins" on public.space_role_permissions;
create policy "space_role_permissions_insert_admins"
on public.space_role_permissions
for insert
to authenticated
with check (public.has_space_role(space_id, array['admin'::public.app_role]));

drop policy if exists "space_role_permissions_update_admins" on public.space_role_permissions;
create policy "space_role_permissions_update_admins"
on public.space_role_permissions
for update
to authenticated
using (public.has_space_role(space_id, array['admin'::public.app_role]))
with check (public.has_space_role(space_id, array['admin'::public.app_role]));

drop policy if exists "space_role_permissions_delete_admins" on public.space_role_permissions;
create policy "space_role_permissions_delete_admins"
on public.space_role_permissions
for delete
to authenticated
using (public.has_space_role(space_id, array['admin'::public.app_role]));

drop policy if exists "work_orders_select_members" on public.work_orders;
create policy "work_orders_select_members"
on public.work_orders
for select
to authenticated
using (public.is_space_member(space_id));

drop policy if exists "work_orders_insert_members" on public.work_orders;
create policy "work_orders_insert_members"
on public.work_orders
for insert
to authenticated
with check (
  created_by_user_id = auth.uid()
  and public.is_space_member(space_id)
);

drop policy if exists "work_orders_update_open_states" on public.work_orders;
create policy "work_orders_update_open_states"
on public.work_orders
for update
to authenticated
using (public.can_edit_work_order(id))
with check (public.is_space_member(space_id));

drop policy if exists "work_order_memberships_select_members" on public.work_order_memberships;
create policy "work_order_memberships_select_members"
on public.work_order_memberships
for select
to authenticated
using (public.can_access_work_order(work_order_id));

drop policy if exists "work_order_memberships_insert_editors" on public.work_order_memberships;
create policy "work_order_memberships_insert_editors"
on public.work_order_memberships
for insert
to authenticated
with check (public.can_edit_work_order(work_order_id));

drop policy if exists "work_order_memberships_update_editors" on public.work_order_memberships;
create policy "work_order_memberships_update_editors"
on public.work_order_memberships
for update
to authenticated
using (public.can_edit_work_order(work_order_id))
with check (public.can_edit_work_order(work_order_id));

drop policy if exists "work_order_memberships_delete_editors" on public.work_order_memberships;
create policy "work_order_memberships_delete_editors"
on public.work_order_memberships
for delete
to authenticated
using (public.can_edit_work_order(work_order_id));

drop policy if exists "job_market_posts_select_members" on public.job_market_posts;
create policy "job_market_posts_select_members"
on public.job_market_posts
for select
to authenticated
using (public.is_space_member(space_id));

drop policy if exists "document_folders_select_members" on public.document_folders;
create policy "document_folders_select_members"
on public.document_folders
for select
to authenticated
using (public.is_space_member(space_id));

drop policy if exists "document_folders_insert_editors" on public.document_folders;
create policy "document_folders_insert_editors"
on public.document_folders
for insert
to authenticated
with check (
  (
    work_order_id is null
    and public.has_space_role(
      space_id,
      array['admin'::public.app_role, 'manager'::public.app_role]
    )
  )
  or (
    work_order_id is not null
    and public.can_edit_work_order(work_order_id)
  )
);

drop policy if exists "document_folders_update_editors" on public.document_folders;
create policy "document_folders_update_editors"
on public.document_folders
for update
to authenticated
using (
  (
    work_order_id is null
    and public.has_space_role(
      space_id,
      array['admin'::public.app_role, 'manager'::public.app_role]
    )
  )
  or (
    work_order_id is not null
    and public.can_edit_work_order(work_order_id)
  )
)
with check (
  (
    work_order_id is null
    and public.has_space_role(
      space_id,
      array['admin'::public.app_role, 'manager'::public.app_role]
    )
  )
  or (
    work_order_id is not null
    and public.can_edit_work_order(work_order_id)
  )
);

drop policy if exists "document_folders_delete_editors" on public.document_folders;
create policy "document_folders_delete_editors"
on public.document_folders
for delete
to authenticated
using (
  (
    work_order_id is null
    and public.has_space_role(
      space_id,
      array['admin'::public.app_role, 'manager'::public.app_role]
    )
  )
  or (
    work_order_id is not null
    and public.can_edit_work_order(work_order_id)
  )
);

drop policy if exists "documents_select_members" on public.documents;
create policy "documents_select_members"
on public.documents
for select
to authenticated
using (public.is_space_member(space_id));

drop policy if exists "documents_insert_editors" on public.documents;
create policy "documents_insert_editors"
on public.documents
for insert
to authenticated
with check (
  (
    work_order_id is null
    and public.has_space_role(
      space_id,
      array['admin'::public.app_role, 'manager'::public.app_role]
    )
  )
  or (
    work_order_id is not null
    and public.can_edit_work_order(work_order_id)
  )
);

drop policy if exists "documents_update_editors" on public.documents;
create policy "documents_update_editors"
on public.documents
for update
to authenticated
using (
  (
    work_order_id is null
    and public.has_space_role(
      space_id,
      array['admin'::public.app_role, 'manager'::public.app_role]
    )
  )
  or (
    work_order_id is not null
    and public.can_edit_work_order(work_order_id)
  )
)
with check (
  (
    work_order_id is null
    and public.has_space_role(
      space_id,
      array['admin'::public.app_role, 'manager'::public.app_role]
    )
  )
  or (
    work_order_id is not null
    and public.can_edit_work_order(work_order_id)
  )
);

drop policy if exists "documents_delete_editors" on public.documents;
create policy "documents_delete_editors"
on public.documents
for delete
to authenticated
using (
  (
    work_order_id is null
    and public.has_space_role(
      space_id,
      array['admin'::public.app_role, 'manager'::public.app_role]
    )
  )
  or (
    work_order_id is not null
    and public.can_edit_work_order(work_order_id)
  )
);

drop policy if exists "work_order_messages_select_members" on public.work_order_messages;
create policy "work_order_messages_select_members"
on public.work_order_messages
for select
to authenticated
using (public.can_access_work_order(work_order_id));

drop policy if exists "work_order_messages_insert_editors" on public.work_order_messages;
create policy "work_order_messages_insert_editors"
on public.work_order_messages
for insert
to authenticated
with check (
  sender_user_id = auth.uid()
  and public.can_edit_work_order(work_order_id)
);

drop policy if exists "work_order_messages_update_sender" on public.work_order_messages;
create policy "work_order_messages_update_sender"
on public.work_order_messages
for update
to authenticated
using (
  sender_user_id = auth.uid()
  and public.can_edit_work_order(work_order_id)
)
with check (
  sender_user_id = auth.uid()
  and public.can_edit_work_order(work_order_id)
);

drop policy if exists "work_order_message_attachments_select_members" on public.work_order_message_attachments;
create policy "work_order_message_attachments_select_members"
on public.work_order_message_attachments
for select
to authenticated
using (
  exists (
    select 1
    from public.work_order_messages
    where work_order_messages.id = work_order_message_attachments.message_id
      and public.can_access_work_order(work_order_messages.work_order_id)
  )
);

drop policy if exists "work_order_message_attachments_insert_editors" on public.work_order_message_attachments;
create policy "work_order_message_attachments_insert_editors"
on public.work_order_message_attachments
for insert
to authenticated
with check (
  exists (
    select 1
    from public.work_order_messages
    where work_order_messages.id = work_order_message_attachments.message_id
      and public.can_edit_work_order(work_order_messages.work_order_id)
  )
);

drop policy if exists "work_order_message_attachments_update_editors" on public.work_order_message_attachments;
create policy "work_order_message_attachments_update_editors"
on public.work_order_message_attachments
for update
to authenticated
using (
  exists (
    select 1
    from public.work_order_messages
    where work_order_messages.id = work_order_message_attachments.message_id
      and public.can_edit_work_order(work_order_messages.work_order_id)
  )
)
with check (
  exists (
    select 1
    from public.work_order_messages
    where work_order_messages.id = work_order_message_attachments.message_id
      and public.can_edit_work_order(work_order_messages.work_order_id)
  )
);

drop policy if exists "work_order_message_attachments_delete_editors" on public.work_order_message_attachments;
create policy "work_order_message_attachments_delete_editors"
on public.work_order_message_attachments
for delete
to authenticated
using (
  exists (
    select 1
    from public.work_order_messages
    where work_order_messages.id = work_order_message_attachments.message_id
      and public.can_edit_work_order(work_order_messages.work_order_id)
  )
);

drop policy if exists "activity_logs_select_members" on public.activity_logs;
create policy "activity_logs_select_members"
on public.activity_logs
for select
to authenticated
using (public.is_space_member(space_id));

drop policy if exists "activity_logs_insert_members" on public.activity_logs;
create policy "activity_logs_insert_members"
on public.activity_logs
for insert
to authenticated
with check (public.is_space_member(space_id));

drop policy if exists "invites_select_admins_or_target_email" on public.invites;
create policy "invites_select_admins_or_target_email"
on public.invites
for select
to authenticated
using (
  public.has_space_role(space_id, array['admin'::public.app_role])
  or lower(coalesce(auth.jwt() ->> 'email', '')) = lower(email::text)
);

drop policy if exists "invites_insert_admins" on public.invites;
create policy "invites_insert_admins"
on public.invites
for insert
to authenticated
with check (
  invited_by_user_id = auth.uid()
  and public.has_space_role(space_id, array['admin'::public.app_role])
);

drop policy if exists "invites_update_admins" on public.invites;
create policy "invites_update_admins"
on public.invites
for update
to authenticated
using (public.has_space_role(space_id, array['admin'::public.app_role]))
with check (public.has_space_role(space_id, array['admin'::public.app_role]));

drop policy if exists "invites_delete_admins" on public.invites;
create policy "invites_delete_admins"
on public.invites
for delete
to authenticated
using (public.has_space_role(space_id, array['admin'::public.app_role]));
