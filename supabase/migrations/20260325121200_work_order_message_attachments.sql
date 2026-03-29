create table if not exists public.work_order_message_attachments (
  id uuid primary key default extensions.gen_random_uuid(),
  message_id uuid not null references public.work_order_messages(id) on delete cascade,
  document_id uuid references public.documents(id) on delete set null,
  file_name text not null,
  mime_type text,
  file_size_bytes bigint,
  storage_path text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists work_order_message_attachments_message_id_idx
  on public.work_order_message_attachments (message_id);
