alter table public.work_orders
  drop constraint if exists work_orders_subject_type_check;

alter table public.work_orders
  add constraint work_orders_subject_type_check
  check (
    subject_type in (
      'issue',
      'maintenance',
      'inspection',
      'project',
      'emergency'
    )
  );
