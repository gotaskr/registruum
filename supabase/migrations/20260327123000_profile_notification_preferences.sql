alter table public.profiles
  add column if not exists in_app_notifications_enabled boolean not null default true,
  add column if not exists email_notifications_enabled boolean not null default true,
  add column if not exists mentions_only_mode boolean not null default false;
