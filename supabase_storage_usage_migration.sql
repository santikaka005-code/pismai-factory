-- Read-only database usage summary for the Home dashboard.
-- Run once in the Supabase SQL editor.

create or replace function public.get_database_storage_usage()
returns jsonb
language sql
security definer
set search_path = public, pg_catalog
as $$
  select jsonb_build_object(
    'used_bytes', pg_database_size(current_database()),
    'limit_bytes', 524288000,
    'total_rows', coalesce(sum(n_live_tup), 0)::bigint,
    'table_count', count(*)::integer,
    'measured_at', now()
  )
  from pg_stat_user_tables
  where schemaname = 'public';
$$;

revoke all on function public.get_database_storage_usage() from public;
revoke all on function public.get_database_storage_usage() from anon;
revoke all on function public.get_database_storage_usage() from authenticated;
grant execute on function public.get_database_storage_usage() to service_role;
