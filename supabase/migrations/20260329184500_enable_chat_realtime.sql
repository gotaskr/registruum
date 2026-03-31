do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'work_order_messages'
  ) then
    alter publication supabase_realtime add table public.work_order_messages;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'work_order_message_attachments'
  ) then
    alter publication supabase_realtime add table public.work_order_message_attachments;
  end if;
end
$$;
