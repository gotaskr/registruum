drop policy if exists "work_orders_delete_admins" on public.work_orders;

create policy "work_orders_delete_admins"
on public.work_orders
for delete
to authenticated
using (
  status in ('open', 'in_progress')
  and public.has_space_role(
    space_id,
    array['admin'::public.app_role]
  )
);
