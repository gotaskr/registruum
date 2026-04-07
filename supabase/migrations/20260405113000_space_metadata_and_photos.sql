alter table public.spaces
  add column if not exists address text,
  add column if not exists space_type text,
  add column if not exists photo_path text,
  add column if not exists photo_file_name text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'spaces_address_length_check'
  ) then
    alter table public.spaces
      add constraint spaces_address_length_check
      check (
        address is null
        or char_length(trim(address)) <= 200
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'spaces_space_type_check'
  ) then
    alter table public.spaces
      add constraint spaces_space_type_check
      check (
        space_type is null
        or space_type in ('buildings', 'small-business', 'facility', 'factory')
      );
  end if;
end $$;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'space-photos',
  'space-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "space_photos_select_members" on storage.objects;
create policy "space_photos_select_members"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'space-photos'
  and public.is_space_member(public.storage_object_space_id(name))
);

drop policy if exists "space_photos_insert_admins" on storage.objects;
create policy "space_photos_insert_admins"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'space-photos'
  and public.has_space_role(
    public.storage_object_space_id(name),
    array['admin'::public.app_role]
  )
);

drop policy if exists "space_photos_update_admins" on storage.objects;
create policy "space_photos_update_admins"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'space-photos'
  and public.has_space_role(
    public.storage_object_space_id(name),
    array['admin'::public.app_role]
  )
)
with check (
  bucket_id = 'space-photos'
  and public.has_space_role(
    public.storage_object_space_id(name),
    array['admin'::public.app_role]
  )
);

drop policy if exists "space_photos_delete_admins" on storage.objects;
create policy "space_photos_delete_admins"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'space-photos'
  and public.has_space_role(
    public.storage_object_space_id(name),
    array['admin'::public.app_role]
  )
);
