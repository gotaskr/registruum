alter table public.profiles
  add column if not exists user_tag text
  generated always as (
    '#' || upper(left(replace(id::text, '-', ''), 6))
  ) stored;

create unique index if not exists profiles_user_tag_key
  on public.profiles (user_tag);
