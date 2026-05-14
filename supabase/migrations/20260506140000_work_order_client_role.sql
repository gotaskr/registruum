-- Add app_role enum value only (PG requires a separate transaction before using the new value).
-- See 20260506225000_work_order_client_role_functions.sql for RLS/helpers and seed.

alter type public.app_role add value if not exists 'client';
