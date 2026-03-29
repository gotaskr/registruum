alter table public.profiles
  add column if not exists display_name text,
  add column if not exists additional_emails text[] not null default '{}',
  add column if not exists contact_info text,
  add column if not exists avatar_path text,
  add column if not exists avatar_file_name text,
  add column if not exists represents_company boolean not null default false,
  add column if not exists company_name text,
  add column if not exists company_email extensions.citext,
  add column if not exists company_address text;

update public.profiles
set display_name = full_name
where display_name is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_display_name_check'
  ) then
    alter table public.profiles
      add constraint profiles_display_name_check
      check (
        display_name is null
        or char_length(trim(display_name)) between 1 and 160
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_company_name_when_representing_check'
  ) then
    alter table public.profiles
      add constraint profiles_company_name_when_representing_check
      check (
        represents_company = false
        or char_length(trim(coalesce(company_name, ''))) between 1 and 160
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
  'profile-avatars',
  'profile-avatars',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.storage_object_profile_owner_id(object_name text)
returns uuid
language sql
immutable
as $$
  select case
    when split_part(object_name, '/', 1) = 'profiles'
      then nullif(split_part(object_name, '/', 2), '')::uuid
    else null
  end;
$$;

create or replace function public.can_access_profile_avatar(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.storage_object_profile_owner_id(object_name) = auth.uid();
$$;

drop policy if exists "profile_avatars_select_self" on storage.objects;
create policy "profile_avatars_select_self"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'profile-avatars'
  and public.can_access_profile_avatar(name)
);

drop policy if exists "profile_avatars_insert_self" on storage.objects;
create policy "profile_avatars_insert_self"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-avatars'
  and public.can_access_profile_avatar(name)
);

drop policy if exists "profile_avatars_update_self" on storage.objects;
create policy "profile_avatars_update_self"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-avatars'
  and public.can_access_profile_avatar(name)
)
with check (
  bucket_id = 'profile-avatars'
  and public.can_access_profile_avatar(name)
);

drop policy if exists "profile_avatars_delete_self" on storage.objects;
create policy "profile_avatars_delete_self"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-avatars'
  and public.can_access_profile_avatar(name)
);
