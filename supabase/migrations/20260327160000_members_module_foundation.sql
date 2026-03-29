do $$
begin
  alter type public.app_role add value if not exists 'viewer';
exception
  when duplicate_object then null;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'membership_status'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.membership_status as enum ('active', 'removed');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'invite_method'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.invite_method as enum ('email', 'link', 'code');
  end if;
end $$;

create or replace function public.generate_space_invite_token()
returns text
language plpgsql
as $$
declare
  candidate text;
begin
  loop
    candidate := encode(extensions.gen_random_bytes(18), 'hex');
    exit when not exists (
      select 1
      from public.spaces
      where invite_token = candidate
    );
  end loop;

  return candidate;
end;
$$;

create or replace function public.generate_space_invite_code()
returns text
language plpgsql
as $$
declare
  candidate text;
begin
  loop
    candidate := upper(substr(encode(extensions.gen_random_bytes(4), 'hex'), 1, 6));
    exit when not exists (
      select 1
      from public.spaces
      where invite_code = candidate
    );
  end loop;

  return candidate;
end;
$$;

alter table public.spaces
  add column if not exists invite_token text,
  add column if not exists invite_code text;

update public.spaces
set
  invite_token = coalesce(invite_token, public.generate_space_invite_token()),
  invite_code = coalesce(invite_code, public.generate_space_invite_code())
where invite_token is null
   or invite_code is null;

alter table public.spaces
  alter column invite_token set default public.generate_space_invite_token(),
  alter column invite_code set default public.generate_space_invite_code();

create unique index if not exists spaces_invite_token_key
  on public.spaces (invite_token)
  where invite_token is not null;

create unique index if not exists spaces_invite_code_key
  on public.spaces (invite_code)
  where invite_code is not null;

alter table public.space_memberships
  add column if not exists status public.membership_status not null default 'active',
  add column if not exists invited_by_user_id uuid references public.profiles(id) on delete set null,
  add column if not exists removed_by_user_id uuid references public.profiles(id) on delete set null,
  add column if not exists removed_at timestamptz;

create index if not exists space_memberships_space_id_status_idx
  on public.space_memberships (space_id, status);

create index if not exists space_memberships_user_id_status_idx
  on public.space_memberships (user_id, status);

alter table public.invites
  alter column email drop not null;

alter table public.invites
  add column if not exists method public.invite_method not null default 'email',
  add column if not exists message text,
  add column if not exists assigned_work_order_ids uuid[] not null default '{}',
  add column if not exists invite_code text,
  add column if not exists target_user_id uuid references public.profiles(id) on delete set null;

create index if not exists invites_space_id_method_status_idx
  on public.invites (space_id, method, status);

create index if not exists invites_target_user_id_status_idx
  on public.invites (target_user_id, status);

create unique index if not exists invites_invite_code_key
  on public.invites (invite_code)
  where invite_code is not null;

create or replace function public.find_profile_by_user_tag(input_user_tag text)
returns table (
  id uuid,
  full_name text,
  email extensions.citext,
  user_tag text,
  avatar_path text,
  email_verified_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    profiles.id,
    profiles.full_name,
    profiles.email,
    profiles.user_tag,
    profiles.avatar_path,
    profiles.email_verified_at
  from public.profiles
  where profiles.user_tag = case
    when left(trim(input_user_tag), 1) = '#'
      then upper(trim(input_user_tag))
    else '#' || upper(trim(input_user_tag))
  end
  limit 1;
$$;

grant execute on function public.find_profile_by_user_tag(text) to authenticated;

create or replace function public.find_space_by_invite_token(input_token text)
returns table (
  id uuid,
  name text,
  invite_code text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    spaces.id,
    spaces.name,
    spaces.invite_code
  from public.spaces
  where spaces.invite_token = trim(input_token)
  limit 1;
$$;

grant execute on function public.find_space_by_invite_token(text) to authenticated;

create or replace function public.find_space_by_invite_code(input_code text)
returns table (
  id uuid,
  name text,
  invite_code text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    spaces.id,
    spaces.name,
    spaces.invite_code
  from public.spaces
  where spaces.invite_code = upper(trim(input_code))
  limit 1;
$$;

grant execute on function public.find_space_by_invite_code(text) to authenticated;

create or replace function public.accept_space_invite_token(input_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_space public.spaces%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
  into target_space
  from public.spaces
  where invite_token = trim(input_token)
  limit 1;

  if target_space.id is null then
    raise exception 'Invite link not found';
  end if;

  insert into public.space_memberships (
    space_id,
    user_id,
    role,
    status
  )
  values (
    target_space.id,
    auth.uid(),
    'member',
    'active'
  )
  on conflict (space_id, user_id) do update
  set
    status = 'active',
    removed_by_user_id = null,
    removed_at = null;

  return target_space.id;
end;
$$;

grant execute on function public.accept_space_invite_token(text) to authenticated;

create or replace function public.accept_space_invite_code(input_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_space public.spaces%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
  into target_space
  from public.spaces
  where invite_code = upper(trim(input_code))
  limit 1;

  if target_space.id is null then
    raise exception 'Invite code not found';
  end if;

  insert into public.space_memberships (
    space_id,
    user_id,
    role,
    status
  )
  values (
    target_space.id,
    auth.uid(),
    'member',
    'active'
  )
  on conflict (space_id, user_id) do update
  set
    status = 'active',
    removed_by_user_id = null,
    removed_at = null;

  return target_space.id;
end;
$$;

grant execute on function public.accept_space_invite_code(text) to authenticated;

create or replace function public.shares_space_with_profile(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth.uid() = target_profile_id
    or exists (
      select 1
      from public.space_memberships as target_membership
      join public.space_memberships as viewer_membership
        on viewer_membership.space_id = target_membership.space_id
      where target_membership.user_id = target_profile_id
        and target_membership.status = 'active'
        and viewer_membership.user_id = auth.uid()
        and viewer_membership.status = 'active'
    );
$$;

create or replace function public.is_space_member(target_space_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.space_memberships
    where space_id = target_space_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$;

create or replace function public.has_space_role(
  target_space_id uuid,
  allowed_roles public.app_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.space_memberships
    where space_id = target_space_id
      and user_id = auth.uid()
      and status = 'active'
      and role = any (allowed_roles)
  );
$$;
