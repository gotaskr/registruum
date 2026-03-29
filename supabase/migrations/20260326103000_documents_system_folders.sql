alter table public.documents
  add column if not exists document_kind text not null default 'file',
  add column if not exists source text not null default 'manual',
  add column if not exists external_url text,
  add column if not exists chat_message_id uuid references public.work_order_messages(id) on delete set null,
  add column if not exists source_sent_at timestamptz;

alter table public.documents
  alter column storage_path drop not null;

update public.documents
set
  document_kind = case
    when mime_type like 'image/%' then 'photo'
    when mime_type like 'video/%' then 'video'
    else 'file'
  end,
  source = coalesce(source, 'manual'),
  source_sent_at = coalesce(source_sent_at, created_at)
where true;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'documents_document_kind_check'
  ) then
    alter table public.documents
      add constraint documents_document_kind_check
      check (document_kind in ('photo', 'video', 'file', 'link'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'documents_source_check'
  ) then
    alter table public.documents
      add constraint documents_source_check
      check (source in ('manual', 'chat'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'documents_link_external_url_check'
  ) then
    alter table public.documents
      add constraint documents_link_external_url_check
      check (
        (document_kind = 'link' and external_url is not null)
        or document_kind <> 'link'
      );
  end if;
end $$;

create index if not exists documents_chat_message_id_idx
  on public.documents (chat_message_id);

create index if not exists documents_kind_idx
  on public.documents (work_order_id, document_kind);

update storage.buckets
set allowed_mime_types = array[
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
]
where id = 'registruum-files';
