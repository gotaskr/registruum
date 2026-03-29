create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

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
        and viewer_membership.user_id = auth.uid()
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
      and role = any (allowed_roles)
  );
$$;

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
      and public.is_space_member(space_id)
  );
$$;

create or replace function public.can_edit_work_order(target_work_order_id uuid)
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
      and public.is_space_member(space_id)
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    email,
    email_verified_at
  )
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      split_part(new.email, '@', 1)
    ),
    new.email,
    new.email_confirmed_at
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    email = excluded.email,
    email_verified_at = excluded.email_verified_at,
    updated_at = timezone('utc', now());

  return new;
end;
$$;

create or replace function public.handle_space_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.space_memberships (
    space_id,
    user_id,
    role
  )
  values (
    new.id,
    new.created_by_user_id,
    'admin'
  )
  on conflict (space_id, user_id) do nothing;

  perform public.seed_default_role_permissions(new.id);

  return new;
end;
$$;

create or replace function public.handle_work_order_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.work_order_memberships (
    work_order_id,
    user_id,
    role,
    assigned_by_user_id
  )
  values (
    new.id,
    new.created_by_user_id,
    'admin',
    new.created_by_user_id
  )
  on conflict (work_order_id, user_id) do nothing;

  return new;
end;
$$;

create or replace function public.enforce_work_order_job_market_state()
returns trigger
language plpgsql
as $$
begin
  if new.status <> 'open' then
    new.is_posted_to_job_market = false;
  end if;

  return new;
end;
$$;

create or replace function public.sync_job_market_post_from_work_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'open' and new.is_posted_to_job_market then
    insert into public.job_market_posts (
      work_order_id,
      space_id,
      title_snapshot,
      description_snapshot,
      location_label,
      status,
      posted_at
    )
    values (
      new.id,
      new.space_id,
      new.title,
      new.description,
      new.location_label,
      'active',
      timezone('utc', now())
    )
    on conflict (work_order_id) do update
    set
      title_snapshot = excluded.title_snapshot,
      description_snapshot = excluded.description_snapshot,
      location_label = excluded.location_label,
      status = 'active',
      closed_at = null,
      updated_at = timezone('utc', now());
  else
    update public.job_market_posts
    set
      status = case
        when new.status in ('in_progress', 'completed', 'archived') then 'closed'
        else 'withdrawn'
      end,
      closed_at = coalesce(closed_at, timezone('utc', now())),
      updated_at = timezone('utc', now())
    where work_order_id = new.id
      and status = 'active';
  end if;

  return new;
end;
$$;
