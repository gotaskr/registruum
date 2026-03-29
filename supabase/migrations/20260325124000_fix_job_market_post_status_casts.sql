create or replace function public.sync_job_market_post_from_work_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'open' and new.is_posted_to_job_market then
    insert into public.job_market_posts (
      work_order_id,
      space_id,
      title_snapshot,
      description_snapshot,
      location_label,
      status,
      posted_at
    )
    values (
      new.id,
      new.space_id,
      new.title,
      new.description,
      new.location_label,
      'active'::public.job_market_post_status,
      timezone('utc', now())
    )
    on conflict (work_order_id) do update
    set
      title_snapshot = excluded.title_snapshot,
      description_snapshot = excluded.description_snapshot,
      location_label = excluded.location_label,
      status = 'active'::public.job_market_post_status,
      closed_at = null,
      updated_at = timezone('utc', now());
  else
    update public.job_market_posts
    set
      status = case
        when new.status in ('in_progress', 'completed', 'archived')
          then 'closed'::public.job_market_post_status
        else 'withdrawn'::public.job_market_post_status
      end,
      closed_at = coalesce(closed_at, timezone('utc', now())),
      updated_at = timezone('utc', now())
    where work_order_id = new.id
      and status = 'active'::public.job_market_post_status;
  end if;

  return new;
end;
$$;
