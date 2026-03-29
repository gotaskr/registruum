create table if not exists public.document_folders (
  id uuid primary key default extensions.gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  work_order_id uuid references public.work_orders(id) on delete cascade,
  parent_folder_id uuid references public.document_folders(id) on delete cascade,
  created_by_user_id uuid not null references public.profiles(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 1 and 200),
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (parent_folder_id is null or parent_folder_id <> id)
);

create index if not exists document_folders_space_id_idx
  on public.document_folders (space_id);

create index if not exists document_folders_work_order_id_idx
  on public.document_folders (work_order_id);
