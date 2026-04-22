-- Invited users could not see pending invites when JWT email was missing or differed from
-- profiles.email, even though invites.target_user_id was set (e.g. user-tag team invites).

drop policy if exists "invites_select_admins_or_target_email" on public.invites;

create policy "invites_select_admins_or_target_email"
on public.invites
for select
to authenticated
using (
  public.has_space_role(space_id, array['admin'::public.app_role])
  or target_user_id = auth.uid()
  or (
    email is not null
    and lower(coalesce(auth.jwt() ->> 'email', '')) = lower(email::text)
  )
);
