alter table public.work_orders
  add column if not exists subject_type text not null default 'issue',
  add column if not exists subject text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'work_orders_subject_type_check'
  ) then
    alter table public.work_orders
      add constraint work_orders_subject_type_check
      check (subject_type in ('issue', 'project'));
  end if;
end $$;

update public.work_orders
set
  subject_type = case
    when description ~ '^Project:\s*' then 'project'
    else 'issue'
  end,
  subject = case
    when description ~ '^(Issue|Project):\s*'
      then nullif(
        trim(
          regexp_replace(
            split_part(description, E'\n', 1),
            '^(Issue|Project):\s*',
            ''
          )
        ),
        ''
      )
    else subject
  end,
  description = case
    when description ~ '^(Issue|Project):\s*'
      then nullif(
        trim(
          regexp_replace(
            description,
            '^(Issue|Project):\s*[^\n]*(\n\s*\n?)?',
            ''
          )
        ),
        ''
      )
    else description
  end;
