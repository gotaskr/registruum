create table if not exists public.invites (
  id uuid primary key default extensions.gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  invited_by_user_id uuid not null references public.profiles(id) on delete restrict,
  email extensions.citext not null,
  role public.app_role not null,
  token_hash text not null unique,
  status public.invite_status not null default 'pending',
  expires_at timestamptz not null,
  accepted_by_user_id uuid references public.profiles(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists invites_space_id_status_idx
  on public.invites (space_id, status);

create index if not exists invites_email_status_idx
  on public.invites (email, status);
