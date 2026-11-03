-- Pismai: restrict legacy SECURITY DEFINER mutations to the web server.
-- Run this entire file in the existing project's Supabase SQL Editor.
-- This changes function privileges only; it does not modify business rows.
-- Missing optional accounting functions are skipped. Safe to run again.
begin;

do $rpc_permissions_hardening$
declare
  function_identity text;
begin
  foreach function_identity in array array[
    'public.apply_deduction_batch(date,text,jsonb)',
    'public.ac_post_journal(uuid,text)',
    'public.ac_close_period(uuid,text)',
    'public.ac_create_journal(text,date,text,text,text,text,jsonb,text,boolean)',
    'public.ac_approve_journal(uuid,text,text)',
    'public.ac_reject_journal(uuid,text,text,text)'
  ] loop
    if to_regprocedure(function_identity) is not null then
      execute format('revoke execute on function %s from public, anon, authenticated', function_identity);
      execute format('grant execute on function %s to service_role', function_identity);
    end if;
  end loop;
end;
$rpc_permissions_hardening$;

notify pgrst, 'reload schema';
commit;
