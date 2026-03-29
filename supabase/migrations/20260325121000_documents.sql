create table if not exists public.documents (
  id uuid primary key default extensions.gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  work_order_id uuid references public.work_orders(id) on delete set null,
  folder_id uuid references public.document_folders(id) on delete set null,
  uploaded_by_user_id uuid not null references public.profiles(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 1 and 200),
  file_name text not null,
  mime_type text,
  storage_path text not null unique,
  file_size_bytes bigint,
  is_archived boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists documents_space_id_idx
  on public.documents (space_id);

create index if not exists documents_work_order_id_idx
  on public.documents (work_order_id);
