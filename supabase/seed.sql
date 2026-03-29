-- Optional local development seed.
-- This intentionally does not insert into auth.users.
-- It only seeds sample rows if a real auth-backed profile already exists.

do $$
declare
  first_profile_id uuid;
  seeded_space_id uuid := '11111111-1111-1111-1111-111111111111';
  seeded_work_order_id uuid := '22222222-2222-2222-2222-222222222222';
begin
  select id
  into first_profile_id
  from public.profiles
  order by created_at
  limit 1;

  if first_profile_id is null then
    raise notice 'Skipping Registruum seed because no auth-backed profile exists yet.';
    return;
  end if;

  insert into public.spaces (
    id,
    name,
    created_by_user_id
  )
  values (
    seeded_space_id,
    'Local Dev Space',
    first_profile_id
  )
  on conflict (id) do nothing;

  insert into public.work_orders (
    id,
    space_id,
    created_by_user_id,
    title,
    location_label,
    description,
    status,
    is_posted_to_job_market
  )
  values (
    seeded_work_order_id,
    seeded_space_id,
    first_profile_id,
    'Local Boiler Inspection',
    'Mechanical Room A1',
    'Seeded local work order for shell verification.',
    'open',
    false
  )
  on conflict (id) do nothing;
end;
$$;
