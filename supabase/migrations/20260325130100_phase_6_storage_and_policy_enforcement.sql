insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'registruum-files',
  'registruum-files',
  false,
  20971520,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "work_orders_select_members" on public.work_orders;
create policy "work_orders_select_members"
on public.work_orders
for select
to authenticated
using (public.can_access_work_order(id));

drop policy if exists "work_orders_insert_members" on public.work_orders;
create policy "work_orders_insert_members"
on public.work_orders
for insert
to authenticated
with check (
  created_by_user_id = auth.uid()
  and public.has_space_role(
    space_id,
    array['admin'::public.app_role, 'manager'::public.app_role]
  )
);

drop policy if exists "work_orders_update_open_states" on public.work_orders;
create policy "work_orders_update_open_states"
on public.work_orders
for update
to authenticated
using (public.can_manage_work_order(id))
with check (
  public.has_space_role(
    space_id,
    array['admin'::public.app_role, 'manager'::public.app_role]
  )
);

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
with check (public.can_manage_work_order(work_order_id));

drop policy if exists "work_order_memberships_update_editors" on public.work_order_memberships;
create policy "work_order_memberships_update_editors"
on public.work_order_memberships
for update
to authenticated
using (public.can_manage_work_order(work_order_id))
with check (public.can_manage_work_order(work_order_id));

drop policy if exists "work_order_memberships_delete_editors" on public.work_order_memberships;
create policy "work_order_memberships_delete_editors"
on public.work_order_memberships
for delete
to authenticated
using (public.can_manage_work_order(work_order_id));

drop policy if exists "documents_select_members" on public.documents;
create policy "documents_select_members"
on public.documents
for select
to authenticated
using (
  (
    work_order_id is null
    and public.is_space_member(space_id)
  )
  or (
    work_order_id is not null
    and public.can_access_work_order(work_order_id)
  )
);

drop policy if exists "documents_insert_editors" on public.documents;
create policy "documents_insert_editors"
on public.documents
for insert
to authenticated
with check (
  uploaded_by_user_id = auth.uid()
  and (
    (
      work_order_id is null
      and public.has_space_role(
        space_id,
        array['admin'::public.app_role, 'manager'::public.app_role]
      )
    )
    or (
      work_order_id is not null
      and (
        public.can_upload_work_order_document(work_order_id)
        or public.can_upload_work_order_message_file(work_order_id)
      )
    )
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
    and public.can_manage_work_order(work_order_id)
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
    and public.can_manage_work_order(work_order_id)
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
    and public.can_manage_work_order(work_order_id)
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
  and public.can_upload_work_order_message_file(work_order_id)
);

drop policy if exists "work_order_messages_update_sender" on public.work_order_messages;
create policy "work_order_messages_update_sender"
on public.work_order_messages
for update
to authenticated
using (
  sender_user_id = auth.uid()
  and public.can_upload_work_order_message_file(work_order_id)
)
with check (
  sender_user_id = auth.uid()
  and public.can_upload_work_order_message_file(work_order_id)
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
      and work_order_messages.sender_user_id = auth.uid()
      and public.can_upload_work_order_message_file(work_order_messages.work_order_id)
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
      and work_order_messages.sender_user_id = auth.uid()
      and public.can_upload_work_order_message_file(work_order_messages.work_order_id)
  )
)
with check (
  exists (
    select 1
    from public.work_order_messages
    where work_order_messages.id = work_order_message_attachments.message_id
      and work_order_messages.sender_user_id = auth.uid()
      and public.can_upload_work_order_message_file(work_order_messages.work_order_id)
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
      and work_order_messages.sender_user_id = auth.uid()
      and public.can_upload_work_order_message_file(work_order_messages.work_order_id)
  )
);

drop policy if exists "activity_logs_select_members" on public.activity_logs;
create policy "activity_logs_select_members"
on public.activity_logs
for select
to authenticated
using (
  (
    work_order_id is null
    and public.is_space_member(space_id)
  )
  or (
    work_order_id is not null
    and public.can_access_work_order(work_order_id)
  )
);

drop policy if exists "activity_logs_insert_members" on public.activity_logs;
create policy "activity_logs_insert_members"
on public.activity_logs
for insert
to authenticated
with check (
  (
    work_order_id is null
    and public.is_space_member(space_id)
  )
  or (
    work_order_id is not null
    and public.can_access_work_order(work_order_id)
  )
);

drop policy if exists "registruum_files_select" on storage.objects;
create policy "registruum_files_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'registruum-files'
  and public.can_access_storage_object(name)
);

drop policy if exists "registruum_files_insert" on storage.objects;
create policy "registruum_files_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'registruum-files'
  and public.can_write_storage_object(name)
);

drop policy if exists "registruum_files_update" on storage.objects;
create policy "registruum_files_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'registruum-files'
  and public.can_write_storage_object(name)
)
with check (
  bucket_id = 'registruum-files'
  and public.can_write_storage_object(name)
);

drop policy if exists "registruum_files_delete" on storage.objects;
create policy "registruum_files_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'registruum-files'
  and public.can_write_storage_object(name)
);
