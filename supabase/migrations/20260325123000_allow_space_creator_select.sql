drop policy if exists "spaces_select_members" on public.spaces;

create policy "spaces_select_members"
on public.spaces
for select
to authenticated
using (
  public.is_space_member(id)
  or created_by_user_id = auth.uid()
);
