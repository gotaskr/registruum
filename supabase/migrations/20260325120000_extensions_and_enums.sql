create schema if not exists extensions;

create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'app_role'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.app_role as enum (
      'admin',
      'manager',
      'contractor',
      'member'
    );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'work_order_status'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.work_order_status as enum (
      'open',
      'in_progress',
      'completed',
      'archived'
    );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'permission_scope'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.permission_scope as enum (
      'space',
      'membership',
      'work_order',
      'document',
      'job_market',
      'invite'
    );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'job_market_post_status'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.job_market_post_status as enum (
      'active',
      'closed',
      'withdrawn'
    );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'invite_status'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.invite_status as enum (
      'pending',
      'accepted',
      'revoked',
      'expired'
    );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'activity_log_entity_type'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.activity_log_entity_type as enum (
      'space',
      'space_membership',
      'work_order',
      'work_order_membership',
      'job_market_post',
      'document_folder',
      'document',
      'message',
      'invite'
    );
  end if;
end;
$$;
