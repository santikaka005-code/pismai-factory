-- Run after supabase_accounting_migration.sql.
-- Every query below is read-only.

select 'companies' as check_name, count(*) as row_count from public.ac_companies
union all select 'periods', count(*) from public.ac_periods
union all select 'accounts', count(*) from public.ac_accounts
union all select 'tax_rules', count(*) from public.ac_tax_rules;

select company_key, legal_name, tax_id, vat_registered, active
from public.ac_companies
order by company_key;

select code, name_th, account_type, normal_side, control_type
from public.ac_accounts
order by code;

select period_code, start_date, end_date, status
from public.ac_periods
order by period_code;

select tax_type, code, label_th, rate, effective_from, effective_to, official_source_url
from public.ac_tax_rules
order by tax_type, effective_from;

select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and (tablename like 'ac_%' or tablename in ('accounting_workspaces','accounting_change_log'))
order by tablename;

select routine_name
from information_schema.routines
where routine_schema = 'public' and routine_name like 'ac_%'
order by routine_name;
