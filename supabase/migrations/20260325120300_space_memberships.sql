create table if not exists public.space_memberships (
  id uuid primary key default extensions.gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (space_id, user_id)
);

create index if not exists space_memberships_user_id_idx
  on public.space_memberships (user_id);

create index if not exists space_memberships_space_id_role_idx
  on public.space_memberships (space_id, role);
