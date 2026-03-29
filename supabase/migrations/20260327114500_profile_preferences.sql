alter table public.profiles
  add column if not exists theme_preference text not null default 'light',
  add column if not exists default_landing_page text not null default 'dashboard',
  add column if not exists timezone text not null default 'America/Edmonton',
  add column if not exists date_format text not null default 'YYYY-MM-DD';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_theme_preference_check'
  ) then
    alter table public.profiles
      add constraint profiles_theme_preference_check
      check (theme_preference in ('light', 'dark'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_default_landing_page_check'
  ) then
    alter table public.profiles
      add constraint profiles_default_landing_page_check
      check (default_landing_page in ('last_space', 'dashboard'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_date_format_check'
  ) then
    alter table public.profiles
      add constraint profiles_date_format_check
      check (date_format in ('YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY'));
  end if;
end $$;
