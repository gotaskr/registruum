alter table public.profiles
  add column if not exists company_website text,
  add column if not exists company_facebook_url text,
  add column if not exists company_x_url text,
  add column if not exists company_instagram_url text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_company_website_length_check'
  ) then
    alter table public.profiles
      add constraint profiles_company_website_length_check
      check (
        company_website is null
        or char_length(trim(company_website)) <= 500
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_company_facebook_url_length_check'
  ) then
    alter table public.profiles
      add constraint profiles_company_facebook_url_length_check
      check (
        company_facebook_url is null
        or char_length(trim(company_facebook_url)) <= 500
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_company_x_url_length_check'
  ) then
    alter table public.profiles
      add constraint profiles_company_x_url_length_check
      check (
        company_x_url is null
        or char_length(trim(company_x_url)) <= 500
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_company_instagram_url_length_check'
  ) then
    alter table public.profiles
      add constraint profiles_company_instagram_url_length_check
      check (
        company_instagram_url is null
        or char_length(trim(company_instagram_url)) <= 500
      );
  end if;
end $$;
