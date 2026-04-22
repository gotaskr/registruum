-- Realtime postgres_changes for membership rows (removal UX in the browser).
-- REPLICA IDENTITY FULL so DELETE/UPDATE payloads include columns needed for filters.

alter table public.work_order_memberships replica identity full;
alter table public.space_memberships replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'work_order_memberships'
  ) then
    alter publication supabase_realtime add table public.work_order_memberships;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'space_memberships'
  ) then
    alter publication supabase_realtime add table public.space_memberships;
  end if;
end $$;
