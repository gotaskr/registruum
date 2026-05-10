alter table public.profiles
  add column if not exists notifications_last_viewed_at timestamptz;

comment on column public.profiles.notifications_last_viewed_at is
  'When the user last opened the in-app notification panel; used to compute unread mention badge count.';
