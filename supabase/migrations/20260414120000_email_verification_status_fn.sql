-- Server-side only: used by Next.js API with service role to poll email confirmation
-- without listing all auth users. Revoked from API roles by default.

create or replace function public.email_verification_status(p_email text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (
      select (au.email_confirmed_at is not null)
      from auth.users au
      where au.email is not null
        and lower(au.email::text) = lower(trim(p_email))
      limit 1
    ),
    false
  );
$$;

revoke all on function public.email_verification_status(text) from public;
grant execute on function public.email_verification_status(text) to service_role;
