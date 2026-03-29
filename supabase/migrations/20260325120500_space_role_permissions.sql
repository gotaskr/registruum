create table if not exists public.space_role_permissions (
  id uuid primary key default extensions.gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  role public.app_role not null,
  permission_key text not null references public.permission_definitions(key) on delete cascade,
  is_allowed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (space_id, role, permission_key)
);

create index if not exists space_role_permissions_space_role_idx
  on public.space_role_permissions (space_id, role);
