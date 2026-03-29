drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_spaces_updated_at on public.spaces;
create trigger set_spaces_updated_at
before update on public.spaces
for each row
execute function public.set_updated_at();

drop trigger if exists set_space_role_permissions_updated_at on public.space_role_permissions;
create trigger set_space_role_permissions_updated_at
before update on public.space_role_permissions
for each row
execute function public.set_updated_at();

drop trigger if exists set_work_orders_updated_at on public.work_orders;
create trigger set_work_orders_updated_at
before update on public.work_orders
for each row
execute function public.set_updated_at();

drop trigger if exists set_job_market_posts_updated_at on public.job_market_posts;
create trigger set_job_market_posts_updated_at
before update on public.job_market_posts
for each row
execute function public.set_updated_at();

drop trigger if exists set_document_folders_updated_at on public.document_folders;
create trigger set_document_folders_updated_at
before update on public.document_folders
for each row
execute function public.set_updated_at();

drop trigger if exists set_documents_updated_at on public.documents;
create trigger set_documents_updated_at
before update on public.documents
for each row
execute function public.set_updated_at();

drop trigger if exists set_work_order_messages_updated_at on public.work_order_messages;
create trigger set_work_order_messages_updated_at
before update on public.work_order_messages
for each row
execute function public.set_updated_at();

drop trigger if exists set_invites_updated_at on public.invites;
create trigger set_invites_updated_at
before update on public.invites
for each row
execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
after update of email, raw_user_meta_data, email_confirmed_at on auth.users
for each row
execute function public.handle_new_user();

drop trigger if exists on_space_created on public.spaces;
create trigger on_space_created
after insert on public.spaces
for each row
execute function public.handle_space_created();

drop trigger if exists on_work_order_created on public.work_orders;
create trigger on_work_order_created
after insert on public.work_orders
for each row
execute function public.handle_work_order_created();

drop trigger if exists before_work_order_job_market_state on public.work_orders;
create trigger before_work_order_job_market_state
before insert or update of status, is_posted_to_job_market
on public.work_orders
for each row
execute function public.enforce_work_order_job_market_state();

drop trigger if exists after_work_order_job_market_sync on public.work_orders;
create trigger after_work_order_job_market_sync
after insert or update of status, is_posted_to_job_market, title, description, location_label
on public.work_orders
for each row
execute function public.sync_job_market_post_from_work_order();
