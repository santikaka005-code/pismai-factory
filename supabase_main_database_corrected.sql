-- PISMAI FACTORY - RUN FIRST: MAIN DATABASE SCHEMA
-- Generated for moving Pismai Factory to a new Supabase project/org.
-- Safe intention: create missing objects only; do not delete business data.
-- Run in Supabase Dashboard > SQL Editor.
-- If an error appears, stop and send the exact error text to Codex before continuing.

set statement_timeout = '120s';



----------------------------------------------------------------------------------------
-- CORE BUSINESS SCHEMA: accounts, employees, wage rates, production, time, deductions
-- Source: generated:supabase_setup_without_audit_logs
----------------------------------------------------------------------------------------

create extension if not exists citext;

create table if not exists public.account_users (
  id bigserial primary key,
  username citext not null unique,
  password_hash text not null,
  fullname text not null,
  phone text not null default '',
  role text not null default 'operator',
  user_level text not null default 'C1',
  status text not null default 'Active',
  created_by text,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.account_users
  add column if not exists phone text not null default '';

create table if not exists public.employees (
  id bigserial primary key,
  emp_code text not null unique,
  fullname text not null,
  department text not null default '',
  position text not null default '',
  pay_group text not null default '',
  status text not null default 'Active',
  note text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.time_employees (
  id bigserial primary key,
  emp_code text not null unique,
  fullname text not null,
  employee_type text not null default 'normal_347',
  daily_wage numeric(12,2) not null default 347,
  ot_hourly_rate numeric(12,2) not null default 50,
  status text not null default 'Active',
  note text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wage_rates (
  id bigserial primary key,
  item_type text not null,
  rate numeric(12,2) not null default 0,
  effective_date date not null,
  note text,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.production_sessions (
  id bigserial primary key,
  session_date date not null,
  fruit_type text not null default 'mangosteen',
  status text not null default 'open',
  created_by text,
  closed_by text,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  raw_payload jsonb not null default '{}'::jsonb
);

alter table public.production_sessions
  add column if not exists raw_payload jsonb not null default '{}'::jsonb;

create table if not exists public.production_records (
  id bigserial primary key,
  record_date date not null,
  session_id bigint references public.production_sessions(id) on delete set null,
  employee_id bigint references public.employees(id) on delete set null,
  emp_code text,
  employee_name text,
  pay_group text,
  fruit_type text not null default 'mangosteen',
  pile_no text,
  item_type text,
  water_weight numeric(12,2) not null default 0,
  flower_weight numeric(12,2) not null default 0,
  grade_weights jsonb not null default '{}'::jsonb,
  grade_rates jsonb not null default '{}'::jsonb,
  grade_amounts jsonb not null default '{}'::jsonb,
  total_weight numeric(12,2) not null default 0,
  rate numeric(12,2) not null default 0,
  amount numeric(12,2) not null default 0,
  note text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  raw_payload jsonb not null default '{}'::jsonb
);

alter table public.production_records
  add column if not exists grade_weights jsonb not null default '{}'::jsonb,
  add column if not exists grade_rates jsonb not null default '{}'::jsonb,
  add column if not exists grade_amounts jsonb not null default '{}'::jsonb;

create table if not exists public.time_records (
  id bigserial primary key,
  work_date date not null,
  employee_id bigint references public.employees(id) on delete set null,
  emp_code text,
  employee_name text,
  check_in time,
  check_out time,
  break_minutes integer not null default 0,
  total_minutes integer not null default 0,
  note text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  raw_payload jsonb not null default '{}'::jsonb
);

alter table public.time_records
  add column if not exists raw_payload jsonb not null default '{}'::jsonb;

create table if not exists public.deduction_records (
  id bigserial primary key,
  employee_kind text not null default 'production',
  employee_id bigint not null,
  emp_code text not null,
  employee_name text not null,
  start_date date not null,
  end_date date not null,
  deduction_type text not null,
  deduction_label text not null,
  amount numeric(12,2) not null default 0,
  note text,
  status text not null default 'Active',
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint deduction_records_employee_kind_check check (employee_kind in ('production', 'time')),
  constraint deduction_records_amount_check check (amount >= 0),
  constraint deduction_records_date_check check (end_date >= start_date)
);

alter table public.deduction_records
  alter column status set default 'Pending';

create table if not exists public.deduction_applications (
  id bigserial primary key,
  deduction_id bigint not null references public.deduction_records(id) on delete restrict,
  employee_kind text not null,
  employee_id bigint not null,
  emp_code text not null,
  employee_name text not null,
  applied_date date not null,
  amount numeric(12,2) not null,
  status text not null default 'Applied',
  note text,
  created_by text,
  created_at timestamptz not null default now(),
  constraint deduction_applications_kind_check check (employee_kind in ('production', 'time')),
  constraint deduction_applications_amount_check check (amount > 0),
  constraint deduction_applications_status_check check (status in ('Applied', 'Reversed'))
);

-- audit_logs is intentionally created in 02_run_second_logs_backup_import_queue.sql

create index if not exists idx_employees_emp_code on public.employees(emp_code);
create index if not exists idx_employees_pay_group on public.employees(pay_group);
create index if not exists idx_time_employees_emp_code on public.time_employees(emp_code);
create index if not exists idx_time_employees_employee_type on public.time_employees(employee_type);
create index if not exists idx_production_records_date on public.production_records(record_date);
create index if not exists idx_production_records_employee on public.production_records(employee_id);
create index if not exists idx_production_records_pay_group on public.production_records(pay_group);
create index if not exists idx_production_records_fruit_type on public.production_records(fruit_type);
create index if not exists idx_production_records_durian on public.production_records(record_date, pile_no) where fruit_type = 'durian';
create index if not exists idx_deduction_records_kind_range on public.deduction_records(employee_kind, start_date, end_date);
create index if not exists idx_deduction_records_employee on public.deduction_records(employee_kind, employee_id, emp_code);
create index if not exists idx_deduction_applications_date on public.deduction_applications(employee_kind, applied_date);
create index if not exists idx_deduction_applications_record on public.deduction_applications(deduction_id, status);
create index if not exists idx_wage_rates_type_date on public.wage_rates(item_type, effective_date);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_account_users_updated_at on public.account_users;
create trigger trg_account_users_updated_at
before update on public.account_users
for each row execute function public.set_updated_at();

drop trigger if exists trg_employees_updated_at on public.employees;
create trigger trg_employees_updated_at
before update on public.employees
for each row execute function public.set_updated_at();

drop trigger if exists trg_time_employees_updated_at on public.time_employees;
create trigger trg_time_employees_updated_at
before update on public.time_employees
for each row execute function public.set_updated_at();

drop trigger if exists trg_production_records_updated_at on public.production_records;
create trigger trg_production_records_updated_at
before update on public.production_records
for each row execute function public.set_updated_at();

drop trigger if exists trg_time_records_updated_at on public.time_records;
create trigger trg_time_records_updated_at
before update on public.time_records
for each row execute function public.set_updated_at();

drop trigger if exists trg_deduction_records_updated_at on public.deduction_records;
create trigger trg_deduction_records_updated_at
before update on public.deduction_records
for each row execute function public.set_updated_at();

-- Imported rows can leave the generated-ID counter behind existing IDs.
-- Keep the counter repair and the original legacy backfill in one statement so
-- all locks remain held, including when this file is run with autocommit.
do $deduction_application_legacy_backfill$
declare
  sequence_name text;
  sequence_increment bigint;
  sequence_cache bigint;
  sequence_max bigint;
  sequence_cycles boolean;
  sequence_last bigint;
  sequence_called boolean;
  maximum_id bigint;
  current_next numeric;
  required_next numeric;
begin
  perform set_config('lock_timeout', '15s', true);

  -- Match apply_deduction_batch's record-before-application lock order.
  lock table public.deduction_records in access exclusive mode;
  lock table public.deduction_applications in access exclusive mode;
  sequence_name := pg_get_serial_sequence('public.deduction_applications', 'id');
  if sequence_name is null then
    raise exception 'deduction_applications.id has no owned sequence; backfill cancelled';
  end if;

  select seqincrement, seqcache, seqmax, seqcycle
  into sequence_increment, sequence_cache, sequence_max, sequence_cycles
  from pg_sequence
  where seqrelid = sequence_name::regclass;
  if sequence_increment is null or sequence_increment <= 0 or sequence_cycles then
    raise exception 'Expected a positive, non-cycling deduction application ID sequence; backfill cancelled';
  end if;

  -- A no-op CACHE alteration locks the sequence without resetting its state.
  execute format('alter sequence %s cache %s', sequence_name, sequence_cache);
  execute format('select last_value, is_called from %s', sequence_name)
    into sequence_last, sequence_called;
  select max(id) into maximum_id from public.deduction_applications;

  if maximum_id is not null then
    current_next := sequence_last::numeric
      + case when sequence_called then sequence_increment else 0 end;
    required_next := greatest(maximum_id::numeric + sequence_increment, current_next);
    if required_next > sequence_max then
      raise exception 'Deduction application ID sequence is exhausted; backfill cancelled';
    end if;
    -- Restart even when ahead to discard IDs cached by other connections.
    -- Unlike setval, RESTART rolls back if this backfill fails.
    execute format('alter sequence %s restart with %s', sequence_name, required_next);
  end if;

insert into public.deduction_applications (
  deduction_id, employee_kind, employee_id, emp_code, employee_name,
  applied_date, amount, note, created_by
)
select
  d.id, d.employee_kind, d.employee_id, d.emp_code, d.employee_name,
  d.start_date, d.amount, 'Migrated from the original deduction workflow', d.created_by
from public.deduction_records d
where d.deduction_type <> 'attendance_bonus'
  and d.status = 'Active'
  and d.amount > 0
  and not exists (
    select 1 from public.deduction_applications a where a.deduction_id = d.id
  );

update public.deduction_records d
set status = 'Completed'
where d.deduction_type <> 'attendance_bonus'
  and d.status = 'Active'
  and exists (
    select 1 from public.deduction_applications a
    where a.deduction_id = d.id and a.status = 'Applied'
  );
end;
$deduction_application_legacy_backfill$;

create or replace function public.apply_deduction_batch(
  p_applied_date date,
  p_created_by text,
  p_items jsonb
)
returns setof public.deduction_applications
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  deduction_row public.deduction_records%rowtype;
  requested numeric(12,2);
  already_applied numeric(12,2);
  inserted_row public.deduction_applications%rowtype;
begin
  if p_applied_date is null then
    raise exception 'applied_date is required';
  end if;
  for item in select value from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    requested := round(coalesce((item->>'amount')::numeric, 0), 2);
    if requested <= 0 then
      raise exception 'deduction amount must be greater than zero';
    end if;
    select * into deduction_row
    from public.deduction_records
    where id = (item->>'deduction_id')::bigint
    for update;
    if not found or deduction_row.deduction_type = 'attendance_bonus' then
      raise exception 'deduction record not found';
    end if;
    if deduction_row.status = 'Cancelled' then
      raise exception 'deduction record is cancelled';
    end if;
    select coalesce(sum(amount), 0) into already_applied
    from public.deduction_applications
    where deduction_id = deduction_row.id and status = 'Applied';
    if requested > deduction_row.amount - already_applied then
      raise exception 'amount exceeds remaining deduction balance';
    end if;
    insert into public.deduction_applications (
      deduction_id, employee_kind, employee_id, emp_code, employee_name,
      applied_date, amount, note, created_by
    ) values (
      deduction_row.id, deduction_row.employee_kind, deduction_row.employee_id,
      deduction_row.emp_code, deduction_row.employee_name, p_applied_date,
      requested, nullif(trim(item->>'note'), ''), nullif(trim(p_created_by), '')
    ) returning * into inserted_row;
    update public.deduction_records
    set status = case when already_applied + requested >= amount then 'Completed' else 'Pending' end,
        updated_by = nullif(trim(p_created_by), '')
    where id = deduction_row.id;
    return next inserted_row;
  end loop;
end;
$$;

alter table public.account_users enable row level security;
alter table public.employees enable row level security;
alter table public.time_employees enable row level security;
alter table public.wage_rates enable row level security;
alter table public.production_sessions enable row level security;
alter table public.production_records enable row level security;
alter table public.time_records enable row level security;
alter table public.deduction_records enable row level security;
alter table public.deduction_applications enable row level security;

grant select, insert, update, delete on public.deduction_records to service_role;
grant usage, select on sequence public.deduction_records_id_seq to service_role;
grant select, insert, update, delete on public.deduction_applications to service_role;
grant usage, select on sequence public.deduction_applications_id_seq to service_role;
-- Only the web server may invoke this SECURITY DEFINER mutation. Session and
-- employee-level permission checks run there before it uses the service role.
revoke execute on function public.apply_deduction_batch(date, text, jsonb) from public, anon, authenticated;
grant execute on function public.apply_deduction_batch(date, text, jsonb) to service_role;



----------------------------------------------------------------------------------------
-- LIVE SYNC PAYLOAD COLUMNS
-- Source: supabase_live_sync_migration.sql
----------------------------------------------------------------------------------------

-- Pismai: add cloud-sync payload storage without altering existing data.
-- Run this entire file in Supabase Dashboard > SQL Editor.

alter table public.production_sessions
  add column if not exists raw_payload jsonb not null default '{}'::jsonb;

alter table public.production_records
  add column if not exists raw_payload jsonb not null default '{}'::jsonb;

alter table public.time_records
  add column if not exists raw_payload jsonb not null default '{}'::jsonb;



----------------------------------------------------------------------------------------
-- DURIAN GRADE COLUMNS
-- Source: supabase_durian_grades_migration.sql
----------------------------------------------------------------------------------------

-- Pismai: add durable grade storage for durian production records.
-- Run this entire file in Supabase Dashboard > SQL Editor.

alter table public.production_records
  add column if not exists grade_weights jsonb not null default '{}'::jsonb,
  add column if not exists grade_rates jsonb not null default '{}'::jsonb,
  add column if not exists grade_amounts jsonb not null default '{}'::jsonb;

create index if not exists idx_production_records_durian
  on public.production_records(record_date, pile_no)
  where fruit_type = 'durian';

notify pgrst, 'reload schema';



----------------------------------------------------------------------------------------
-- TIME EMPLOYEE OT / EMPLOYEE TYPE NORMALIZATION
-- Source: supabase_time_employee_ot_migration.sql
----------------------------------------------------------------------------------------

alter table public.time_employees
  add column if not exists ot_hourly_rate numeric(12,2) not null default 50;

update public.time_employees
set ot_hourly_rate = 50
where ot_hourly_rate is null;

update public.time_employees
set employee_type = 'normal_347',
    daily_wage = 347
where employee_type = 'normal';

update public.time_employees
set employee_type = 'special_365',
    daily_wage = 365
where employee_type = 'special';

create index if not exists idx_time_employees_employee_type
  on public.time_employees(employee_type);



----------------------------------------------------------------------------------------
-- INBOUND RECEIVING CORE TABLES
-- Source: supabase_inbound_receiving_migration.sql
----------------------------------------------------------------------------------------

-- Inbound fruit purchasing: master fruit, recommended-price history, and immutable receipt snapshots.
create table if not exists public.inbound_fruits (
  id bigint generated by default as identity primary key,
  name text not null,
  normalized_name text not null unique,
  status text not null default 'Active' check (status in ('Active', 'Inactive')),
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inbound_fruit_prices (
  id bigint generated by default as identity primary key,
  fruit_id bigint not null references public.inbound_fruits(id) on delete restrict,
  price_per_kg numeric(12,2) not null check (price_per_kg > 0),
  effective_date date not null,
  note text not null default '',
  created_by text not null,
  created_at timestamptz not null default now(),
  unique (fruit_id, effective_date, created_at)
);

create table if not exists public.inbound_receipts (
  id bigint generated by default as identity primary key,
  client_uid text not null unique,
  received_at timestamptz not null,
  supplier_name text not null,
  fruit_id bigint not null references public.inbound_fruits(id) on delete restrict,
  fruit_name text not null,
  weight_kg numeric(14,2) not null check (weight_kg > 0),
  price_per_kg numeric(12,2) not null check (price_per_kg > 0),
  total_amount numeric(16,2) not null check (total_amount >= 0),
  note text not null default '',
  created_by text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_inbound_prices_fruit_effective on public.inbound_fruit_prices(fruit_id, effective_date desc, created_at desc);
create index if not exists idx_inbound_receipts_received_at on public.inbound_receipts(received_at desc);
create index if not exists idx_inbound_receipts_supplier on public.inbound_receipts(supplier_name);
create index if not exists idx_inbound_receipts_fruit on public.inbound_receipts(fruit_id);

alter table public.inbound_fruits enable row level security;
alter table public.inbound_fruit_prices enable row level security;
alter table public.inbound_receipts enable row level security;

-- The web server uses the Supabase service role and performs session/level checks.
revoke all on public.inbound_fruits from anon, authenticated;
revoke all on public.inbound_fruit_prices from anon, authenticated;
revoke all on public.inbound_receipts from anon, authenticated;



----------------------------------------------------------------------------------------
-- PF ACCOUNTING CORE TABLES
-- Source: supabase_accounting_migration.sql
----------------------------------------------------------------------------------------

begin;

create table if not exists public.accounting_workspaces (
  company_key text primary key,
  revision bigint not null default 0,
  workspace jsonb not null default '{}'::jsonb,
  updated_by text not null,
  updated_at timestamptz not null default now(),
  constraint accounting_workspace_object check (jsonb_typeof(workspace) = 'object')
);

create table if not exists public.accounting_change_log (
  id bigserial primary key,
  company_key text not null,
  revision bigint not null,
  action text not null,
  actor_username text not null,
  actor_level text not null,
  workspace_hash text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_accounting_change_log_company_revision
  on public.accounting_change_log(company_key, revision desc);

alter table public.accounting_workspaces enable row level security;
alter table public.accounting_change_log enable row level security;

revoke all on public.accounting_workspaces from anon, authenticated;
revoke all on public.accounting_change_log from anon, authenticated;
grant select, insert, update on public.accounting_workspaces to service_role;
grant select, insert on public.accounting_change_log to service_role;
grant usage, select on sequence public.accounting_change_log_id_seq to service_role;

commit;

-- ARC full accounting schema -------------------------------------------------
begin;
create extension if not exists pgcrypto;

create table if not exists public.ac_companies (
  id uuid primary key default gen_random_uuid(),
  company_key text not null unique,
  legal_name text not null,
  tax_id varchar(13),
  branch_code varchar(5) not null default '00000',
  vat_registered boolean not null default false,
  paid_capital numeric(18,2) not null default 0 check (paid_capital >= 0),
  fiscal_year_end_month smallint not null default 12 check (fiscal_year_end_month between 1 and 12),
  fiscal_year_end_day smallint not null default 31 check (fiscal_year_end_day between 1 and 31),
  base_currency char(3) not null default 'THB',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_periods (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.ac_companies(id) on delete restrict,
  period_code varchar(7) not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'open' check (status in ('open','review','closed')),
  closed_by text,
  closed_at timestamptz,
  reopened_by text,
  reopened_at timestamptz,
  reopen_reason text,
  created_at timestamptz not null default now(),
  unique(company_id, period_code),
  check (start_date <= end_date)
);

create table if not exists public.ac_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.ac_companies(id) on delete restrict,
  code text not null,
  name_th text not null,
  name_en text,
  account_type text not null check (account_type in ('asset','liability','equity','revenue','expense')),
  parent_id uuid references public.ac_accounts(id) on delete restrict,
  normal_side text not null check (normal_side in ('debit','credit')),
  is_contra boolean not null default false,
  control_type text check (control_type is null or control_type in ('ar','ap','bank','cash','inventory','fixed_asset','input_vat','output_vat','wht','retained_earnings')),
  active boolean not null default true,
  system_account boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, code)
);

create table if not exists public.ac_partners (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.ac_companies(id) on delete restrict,
  partner_code text not null,
  partner_type text not null check (partner_type in ('customer','vendor','both','employee','government')),
  legal_name text not null,
  tax_id varchar(13),
  branch_code varchar(5) not null default '00000',
  address text,
  email text,
  phone text,
  payment_terms_days integer not null default 0 check (payment_terms_days >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, partner_code)
);

create table if not exists public.ac_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.ac_companies(id) on delete restrict,
  document_type text not null,
  document_no text not null,
  document_date date not null,
  partner_id uuid references public.ac_partners(id) on delete restrict,
  tax_invoice_no text,
  tax_invoice_date date,
  subtotal numeric(18,2) not null default 0,
  vat_amount numeric(18,2) not null default 0,
  total_amount numeric(18,2) not null default 0,
  currency char(3) not null default 'THB',
  attachment_path text,
  attachment_hash text,
  status text not null default 'draft' check (status in ('draft','verified','posted','void')),
  created_by text not null,
  verified_by text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, document_type, document_no),
  check (subtotal >= 0 and vat_amount >= 0 and total_amount >= 0)
);

create sequence if not exists public.ac_journal_running_seq;
create table if not exists public.ac_journal_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.ac_companies(id) on delete restrict,
  period_id uuid not null references public.ac_periods(id) on delete restrict,
  journal_no text not null,
  journal_type text not null default 'general' check (journal_type in ('general','sales','purchase','receipt','payment','payroll','inventory','production','adjustment','closing','reversal')),
  entry_date date not null,
  reference text,
  description text not null,
  document_id uuid references public.ac_documents(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft','pending_approval','posted','reversed','rejected')),
  source_type text,
  source_id text,
  reversal_of uuid references public.ac_journal_entries(id) on delete restrict,
  created_by text not null,
  created_at timestamptz not null default now(),
  submitted_by text,
  submitted_at timestamptz,
  approved_by text,
  approved_at timestamptz,
  posted_by text,
  posted_at timestamptz,
  reversed_by text,
  reversed_at timestamptz,
  rejection_reason text,
  row_version bigint not null default 1,
  unique(company_id, journal_no),
  unique(company_id, source_type, source_id)
);

create table if not exists public.ac_journal_lines (
  id uuid primary key default gen_random_uuid(),
  journal_id uuid not null references public.ac_journal_entries(id) on delete cascade,
  line_no integer not null check (line_no > 0),
  account_id uuid not null references public.ac_accounts(id) on delete restrict,
  description text,
  debit numeric(18,2) not null default 0 check (debit >= 0),
  credit numeric(18,2) not null default 0 check (credit >= 0),
  partner_id uuid references public.ac_partners(id) on delete restrict,
  due_date date,
  tax_code text,
  cost_center text,
  production_batch text,
  project_code text,
  created_at timestamptz not null default now(),
  unique(journal_id, line_no),
  check ((debit > 0 and credit = 0) or (credit > 0 and debit = 0))
);

create table if not exists public.ac_approvals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.ac_companies(id) on delete restrict,
  entity_type text not null,
  entity_id uuid not null,
  sequence_no integer not null default 1,
  requested_by text not null,
  requested_at timestamptz not null default now(),
  decided_by text,
  decided_at timestamptz,
  decision text not null default 'pending' check (decision in ('pending','approved','rejected')),
  comment text,
  check (decided_by is null or decided_by <> requested_by),
  unique(entity_type, entity_id, sequence_no)
);

create table if not exists public.ac_open_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.ac_companies(id) on delete restrict,
  partner_id uuid not null references public.ac_partners(id) on delete restrict,
  journal_line_id uuid not null references public.ac_journal_lines(id) on delete restrict,
  item_type text not null check (item_type in ('receivable','payable')),
  document_no text not null,
  document_date date not null,
  due_date date not null,
  original_amount numeric(18,2) not null check (original_amount > 0),
  outstanding_amount numeric(18,2) not null check (outstanding_amount >= 0),
  status text not null default 'open' check (status in ('open','partial','settled','written_off')),
  created_at timestamptz not null default now()
);

create table if not exists public.ac_settlements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.ac_companies(id) on delete restrict,
  open_item_id uuid not null references public.ac_open_items(id) on delete restrict,
  payment_journal_line_id uuid not null references public.ac_journal_lines(id) on delete restrict,
  settlement_date date not null,
  amount numeric(18,2) not null check (amount > 0),
  created_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.ac_tax_rules (
  id uuid primary key default gen_random_uuid(),
  tax_type text not null check (tax_type in ('vat','wht','cit','sso')),
  code text not null,
  label_th text not null,
  rate numeric(9,6) not null check (rate >= 0),
  effective_from date not null,
  effective_to date,
  conditions jsonb not null default '{}'::jsonb,
  official_source_url text not null,
  verified_at timestamptz not null,
  verified_by text not null,
  active boolean not null default true,
  unique(tax_type, code, effective_from),
  check (effective_to is null or effective_to >= effective_from)
);

create table if not exists public.ac_tax_transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.ac_companies(id) on delete restrict,
  document_id uuid references public.ac_documents(id) on delete restrict,
  journal_line_id uuid references public.ac_journal_lines(id) on delete restrict,
  partner_id uuid references public.ac_partners(id) on delete restrict,
  tax_type text not null check (tax_type in ('input_vat','output_vat','wht_payable','wht_credit','cit')),
  tax_period varchar(7) not null,
  tax_base numeric(18,2) not null default 0,
  rate numeric(9,6) not null default 0,
  tax_amount numeric(18,2) not null default 0,
  deductible boolean,
  disallow_reason text,
  filing_status text not null default 'unfiled' check (filing_status in ('unfiled','prepared','filed','amended')),
  filing_reference text,
  created_at timestamptz not null default now(),
  check (tax_base >= 0 and rate >= 0 and tax_amount >= 0)
);

create table if not exists public.ac_tax_filings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.ac_companies(id) on delete restrict,
  form_type text not null,
  tax_period varchar(7) not null,
  due_date date not null,
  taxable_base numeric(18,2) not null default 0,
  tax_amount numeric(18,2) not null default 0,
  surcharge numeric(18,2) not null default 0,
  penalty numeric(18,2) not null default 0,
  status text not null default 'draft' check (status in ('draft','review','approved','filed','amended')),
  filing_reference text,
  filed_at timestamptz,
  filed_by text,
  attachment_path text,
  unique(company_id, form_type, tax_period, status)
);

create table if not exists public.ac_bank_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.ac_companies(id) on delete restrict,
  ledger_account_id uuid not null references public.ac_accounts(id) on delete restrict,
  bank_name text not null,
  account_name text not null,
  masked_account_no text not null,
  active boolean not null default true,
  unique(company_id, ledger_account_id)
);

create table if not exists public.ac_bank_statement_lines (
  id uuid primary key default gen_random_uuid(),
  bank_account_id uuid not null references public.ac_bank_accounts(id) on delete restrict,
  statement_date date not null,
  reference text,
  description text,
  amount numeric(18,2) not null check (amount <> 0),
  running_balance numeric(18,2),
  import_batch text not null,
  source_hash text not null,
  matched boolean not null default false,
  created_at timestamptz not null default now(),
  unique(bank_account_id, source_hash)
);

create table if not exists public.ac_bank_matches (
  id uuid primary key default gen_random_uuid(),
  statement_line_id uuid not null references public.ac_bank_statement_lines(id) on delete restrict,
  journal_line_id uuid not null references public.ac_journal_lines(id) on delete restrict,
  matched_amount numeric(18,2) not null check (matched_amount > 0),
  matched_by text not null,
  matched_at timestamptz not null default now(),
  unique(statement_line_id, journal_line_id)
);

create table if not exists public.ac_inventory_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.ac_companies(id) on delete restrict,
  sku text not null,
  name text not null,
  item_type text not null check (item_type in ('raw_material','packaging','wip','finished_goods','consumable')),
  uom text not null,
  inventory_account_id uuid not null references public.ac_accounts(id) on delete restrict,
  cogs_account_id uuid not null references public.ac_accounts(id) on delete restrict,
  costing_method text not null default 'weighted_average' check (costing_method in ('weighted_average','fifo','standard')),
  standard_cost numeric(18,4) not null default 0,
  active boolean not null default true,
  unique(company_id, sku)
);

create table if not exists public.ac_inventory_movements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.ac_companies(id) on delete restrict,
  item_id uuid not null references public.ac_inventory_items(id) on delete restrict,
  movement_date date not null,
  movement_type text not null check (movement_type in ('purchase','issue_to_production','production_receipt','sale','return','adjustment','waste','count')),
  quantity numeric(18,4) not null check (quantity <> 0),
  unit_cost numeric(18,4) not null default 0 check (unit_cost >= 0),
  total_cost numeric(18,2) generated always as (round(quantity * unit_cost, 2)) stored,
  lot_no text,
  warehouse text,
  production_batch text,
  journal_id uuid references public.ac_journal_entries(id) on delete restrict,
  source_type text,
  source_id text,
  created_by text not null,
  created_at timestamptz not null default now(),
  unique(company_id, source_type, source_id, item_id)
);

create table if not exists public.ac_production_cost_batches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.ac_companies(id) on delete restrict,
  batch_no text not null,
  production_date date not null,
  fruit_type text,
  input_quantity numeric(18,4) not null default 0,
  output_quantity numeric(18,4) not null default 0,
  waste_quantity numeric(18,4) not null default 0,
  direct_material numeric(18,2) not null default 0,
  direct_labor numeric(18,2) not null default 0,
  factory_overhead numeric(18,2) not null default 0,
  total_cost numeric(18,2) generated always as (direct_material + direct_labor + factory_overhead) stored,
  unit_cost numeric(18,4),
  status text not null default 'draft' check (status in ('draft','calculated','approved','posted')),
  journal_id uuid references public.ac_journal_entries(id) on delete restrict,
  approved_by text,
  approved_at timestamptz,
  unique(company_id, batch_no)
);

create table if not exists public.ac_fixed_assets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.ac_companies(id) on delete restrict,
  asset_code text not null,
  asset_name text not null,
  acquisition_date date not null,
  available_for_use_date date not null,
  cost numeric(18,2) not null check (cost > 0),
  residual_value numeric(18,2) not null default 0 check (residual_value >= 0),
  useful_life_months integer not null check (useful_life_months > 0),
  depreciation_method text not null default 'straight_line' check (depreciation_method in ('straight_line')),
  asset_account_id uuid not null references public.ac_accounts(id) on delete restrict,
  accumulated_depreciation_account_id uuid not null references public.ac_accounts(id) on delete restrict,
  depreciation_expense_account_id uuid not null references public.ac_accounts(id) on delete restrict,
  status text not null default 'active' check (status in ('active','disposed','fully_depreciated')),
  disposal_date date,
  disposal_proceeds numeric(18,2),
  unique(company_id, asset_code),
  check (residual_value <= cost)
);

create table if not exists public.ac_depreciation_runs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.ac_companies(id) on delete restrict,
  asset_id uuid not null references public.ac_fixed_assets(id) on delete restrict,
  period_code varchar(7) not null,
  depreciation_amount numeric(18,2) not null check (depreciation_amount >= 0),
  accumulated_amount numeric(18,2) not null check (accumulated_amount >= 0),
  journal_id uuid references public.ac_journal_entries(id) on delete restrict,
  status text not null default 'calculated' check (status in ('calculated','posted','reversed')),
  unique(asset_id, period_code)
);

create table if not exists public.ac_audit_log (
  id bigserial primary key,
  company_id uuid references public.ac_companies(id) on delete restrict,
  action text not null,
  entity_type text not null,
  entity_id text,
  actor_username text not null,
  actor_level text not null,
  before_data jsonb,
  after_data jsonb,
  request_id uuid default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create index if not exists idx_ac_journal_entries_period_status on public.ac_journal_entries(company_id, period_id, status);
create index if not exists idx_ac_journal_lines_account on public.ac_journal_lines(account_id, journal_id);
create index if not exists idx_ac_open_items_due on public.ac_open_items(company_id, item_type, status, due_date);
create index if not exists idx_ac_tax_transactions_period on public.ac_tax_transactions(company_id, tax_type, tax_period);
create index if not exists idx_ac_inventory_movements_item_date on public.ac_inventory_movements(item_id, movement_date);
create index if not exists idx_ac_audit_log_entity on public.ac_audit_log(company_id, entity_type, entity_id, created_at desc);

create or replace function public.ac_touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create or replace function public.ac_guard_journal_line_change() returns trigger language plpgsql as $$
declare entry_status text; period_status text;
begin
  select j.status, p.status into entry_status, period_status
  from public.ac_journal_entries j join public.ac_periods p on p.id = j.period_id
  where j.id = coalesce(new.journal_id, old.journal_id);
  if period_status = 'closed' then raise exception 'ACCOUNTING_PERIOD_CLOSED'; end if;
  if entry_status in ('posted','reversed') then raise exception 'POSTED_JOURNAL_IMMUTABLE'; end if;
  return coalesce(new, old);
end $$;

create or replace function public.ac_assert_balanced(p_journal_id uuid) returns void language plpgsql as $$
declare total_debit numeric(18,2); total_credit numeric(18,2); line_count integer;
begin
  select coalesce(sum(debit),0), coalesce(sum(credit),0), count(*) into total_debit,total_credit,line_count
  from public.ac_journal_lines where journal_id=p_journal_id;
  if line_count < 2 or total_debit <= 0 or total_debit <> total_credit then
    raise exception 'JOURNAL_NOT_BALANCED debit=% credit=% lines=%', total_debit,total_credit,line_count;
  end if;
end $$;

create or replace function public.ac_post_journal(p_journal_id uuid,p_actor text) returns public.ac_journal_entries
language plpgsql security definer set search_path=public as $$
declare j public.ac_journal_entries%rowtype; p_status text;
begin
  select * into j from public.ac_journal_entries where id=p_journal_id for update;
  if not found then raise exception 'JOURNAL_NOT_FOUND'; end if;
  select status into p_status from public.ac_periods where id=j.period_id;
  if p_status='closed' then raise exception 'ACCOUNTING_PERIOD_CLOSED'; end if;
  if j.status not in ('draft','pending_approval') then raise exception 'INVALID_JOURNAL_STATUS'; end if;
  if j.created_by=p_actor then raise exception 'MAKER_CANNOT_APPROVE_OWN_JOURNAL'; end if;
  perform public.ac_assert_balanced(j.id);
  update public.ac_journal_entries set status='posted',approved_by=p_actor,approved_at=now(),posted_by=p_actor,posted_at=now(),row_version=row_version+1 where id=j.id returning * into j;
  return j;
end $$;

create or replace function public.ac_close_period(p_period_id uuid,p_actor text) returns public.ac_periods
language plpgsql security definer set search_path=public as $$
declare p public.ac_periods%rowtype; draft_count integer;
begin
  select * into p from public.ac_periods where id=p_period_id for update;
  if not found then raise exception 'PERIOD_NOT_FOUND'; end if;
  select count(*) into draft_count from public.ac_journal_entries where period_id=p.id and status in ('draft','pending_approval','rejected');
  if draft_count>0 then raise exception 'PERIOD_HAS_UNFINISHED_JOURNALS count=%',draft_count; end if;
  update public.ac_periods set status='closed',closed_by=p_actor,closed_at=now() where id=p.id returning * into p;
  return p;
end $$;

create or replace function public.ac_prevent_audit_change() returns trigger language plpgsql as $$
begin raise exception 'ACCOUNTING_AUDIT_LOG_IS_APPEND_ONLY'; end $$;

drop trigger if exists trg_ac_journal_line_guard on public.ac_journal_lines;
create trigger trg_ac_journal_line_guard before insert or update or delete on public.ac_journal_lines for each row execute function public.ac_guard_journal_line_change();
drop trigger if exists trg_ac_audit_immutable on public.ac_audit_log;
create trigger trg_ac_audit_immutable before update or delete on public.ac_audit_log for each row execute function public.ac_prevent_audit_change();

do $$ declare table_name text; begin
  foreach table_name in array array['ac_companies','ac_periods','ac_accounts','ac_partners','ac_documents','ac_journal_entries','ac_journal_lines','ac_approvals','ac_open_items','ac_settlements','ac_tax_rules','ac_tax_transactions','ac_tax_filings','ac_bank_accounts','ac_bank_statement_lines','ac_bank_matches','ac_inventory_items','ac_inventory_movements','ac_production_cost_batches','ac_fixed_assets','ac_depreciation_runs','ac_audit_log'] loop
    execute format('alter table public.%I enable row level security',table_name);
    execute format('revoke all on public.%I from anon, authenticated',table_name);
    execute format('grant select,insert,update,delete on public.%I to service_role',table_name);
  end loop;
end $$;
grant usage,select on all sequences in schema public to service_role;
grant execute on function public.ac_assert_balanced(uuid) to service_role;
-- SECURITY DEFINER mutations must pass the web server's signed-session checks.
revoke execute on function public.ac_post_journal(uuid,text) from public, anon, authenticated;
revoke execute on function public.ac_close_period(uuid,text) from public, anon, authenticated;
grant execute on function public.ac_post_journal(uuid,text) to service_role;
grant execute on function public.ac_close_period(uuid,text) to service_role;

insert into public.ac_tax_rules(tax_type,code,label_th,rate,effective_from,effective_to,conditions,official_source_url,verified_at,verified_by)
values
('vat','VAT7','ภาษีมูลค่าเพิ่ม 7%',0.07,'2024-10-01','2026-09-30','{"registration_threshold":1800000}'::jsonb,'https://www.rd.go.th/region/08/chiangrai/265/3664.html',now(),'ARC migration 2026-07-18'),
('wht','SERVICE3','ค่าบริการ/รับจ้างทำของ 3%',0.03,'2002-07-16',null,'{}'::jsonb,'https://www.rd.go.th/3535.html',now(),'ARC migration 2026-07-18'),
('wht','RENT5','ค่าเช่า 5%',0.05,'2002-07-16',null,'{}'::jsonb,'https://www.rd.go.th/3535.html',now(),'ARC migration 2026-07-18'),
('wht','AD2','ค่าโฆษณา 2%',0.02,'2002-07-16',null,'{}'::jsonb,'https://www.rd.go.th/3535.html',now(),'ARC migration 2026-07-18'),
('cit','CIT20','ภาษีเงินได้นิติบุคคลทั่วไป 20%',0.20,'2016-01-01',null,'{}'::jsonb,'https://www.rd.go.th/841.html',now(),'ARC migration 2026-07-18')
on conflict(tax_type,code,effective_from) do update set rate=excluded.rate,effective_to=excluded.effective_to,conditions=excluded.conditions,official_source_url=excluded.official_source_url,verified_at=excluded.verified_at,verified_by=excluded.verified_by;

insert into public.ac_companies(company_key,legal_name,vat_registered)
values('pismai-main','พิศมัยผลไม้แช่แข็ง',true)
on conflict(company_key) do nothing;

insert into public.ac_accounts(company_id,code,name_th,account_type,normal_side,is_contra,control_type,system_account)
select c.id,v.code,v.name_th,v.account_type,v.normal_side,v.is_contra,v.control_type,true
from public.ac_companies c
cross join (values
('1010','เงินสด','asset','debit',false,'cash'),('1020','เงินฝากธนาคาร','asset','debit',false,'bank'),
('1100','ลูกหนี้การค้า','asset','debit',false,'ar'),('1150','ภาษีซื้อ','asset','debit',false,'input_vat'),
('1200','สินค้าคงเหลือ','asset','debit',false,'inventory'),('1300','งานระหว่างทำ','asset','debit',false,'inventory'),
('1500','ที่ดิน อาคารและอุปกรณ์','asset','debit',false,'fixed_asset'),('1590','ค่าเสื่อมราคาสะสม','asset','credit',true,null),
('2010','เจ้าหนี้การค้า','liability','credit',false,'ap'),('2050','ภาษีขาย','liability','credit',false,'output_vat'),
('2060','ภาษีหัก ณ ที่จ่ายค้างจ่าย','liability','credit',false,'wht'),('2100','ค่าใช้จ่ายค้างจ่าย','liability','credit',false,null),
('3010','ทุนจดทะเบียน','equity','credit',false,null),('3100','กำไรสะสม','equity','credit',false,'retained_earnings'),
('4010','รายได้จากการขาย','revenue','credit',false,null),('4020','รายได้จากบริการ','revenue','credit',false,null),
('5010','ต้นทุนขาย','expense','debit',false,null),('5020','ค่าแรงทางตรง','expense','debit',false,null),
('5030','ค่าใช้จ่ายการผลิต','expense','debit',false,null),('6010','เงินเดือนและค่าแรง','expense','debit',false,null),
('6020','ค่าเช่า','expense','debit',false,null),('6030','ค่าสาธารณูปโภค','expense','debit',false,null),
('6040','ค่าขนส่ง','expense','debit',false,null),('6050','ค่าโฆษณา','expense','debit',false,null),
('6090','ค่าใช้จ่ายอื่น','expense','debit',false,null),('6900','ภาษีเงินได้นิติบุคคล','expense','debit',false,null)
) as v(code,name_th,account_type,normal_side,is_contra,control_type)
where c.company_key='pismai-main'
on conflict(company_id,code) do nothing;

insert into public.ac_periods(company_id,period_code,start_date,end_date)
select c.id,to_char(d,'YYYY-MM'),d::date,(d+interval '1 month - 1 day')::date
from public.ac_companies c
cross join generate_series(date_trunc('year',current_date),date_trunc('year',current_date)+interval '23 months',interval '1 month') d
where c.company_key='pismai-main'
on conflict(company_id,period_code) do nothing;

commit;



----------------------------------------------------------------------------------------
-- PF ACCOUNTING RPC FUNCTIONS
-- Source: supabase_accounting_rpc_migration.sql
----------------------------------------------------------------------------------------

begin;

create or replace function public.ac_create_journal(
  p_company_key text,
  p_entry_date date,
  p_journal_type text,
  p_reference text,
  p_description text,
  p_document_no text,
  p_lines jsonb,
  p_actor text,
  p_submit boolean default true
) returns public.ac_journal_entries
language plpgsql security definer set search_path=public as $$
declare
  company_row public.ac_companies%rowtype;
  period_row public.ac_periods%rowtype;
  journal_row public.ac_journal_entries%rowtype;
  line jsonb;
  line_number integer := 0;
  total_debit numeric(18,2) := 0;
  total_credit numeric(18,2) := 0;
  account_company uuid;
  debit_value numeric(18,2);
  credit_value numeric(18,2);
begin
  select * into company_row from public.ac_companies where company_key=p_company_key and active=true;
  if not found then raise exception 'ACCOUNTING_COMPANY_NOT_FOUND'; end if;
  select * into period_row from public.ac_periods
  where company_id=company_row.id and p_entry_date between start_date and end_date for update;
  if not found then raise exception 'ACCOUNTING_PERIOD_NOT_FOUND'; end if;
  if period_row.status='closed' then raise exception 'ACCOUNTING_PERIOD_CLOSED'; end if;
  if jsonb_typeof(p_lines)<>'array' or jsonb_array_length(p_lines)<2 then raise exception 'JOURNAL_REQUIRES_TWO_LINES'; end if;

  insert into public.ac_journal_entries(
    company_id,period_id,journal_no,journal_type,entry_date,reference,description,status,
    source_type,source_id,created_by,submitted_by,submitted_at
  ) values (
    company_row.id,period_row.id,
    'JV-'||to_char(p_entry_date,'YYYYMM')||'-'||lpad(nextval('public.ac_journal_running_seq')::text,7,'0'),
    p_journal_type,p_entry_date,nullif(trim(p_reference),''),trim(p_description),
    case when p_submit then 'pending_approval' else 'draft' end,
    'arc_manual',null,trim(p_actor),case when p_submit then trim(p_actor) end,case when p_submit then now() end
  ) returning * into journal_row;

  for line in select value from jsonb_array_elements(p_lines) loop
    line_number := line_number+1;
    debit_value := round(coalesce((line->>'debit')::numeric,0),2);
    credit_value := round(coalesce((line->>'credit')::numeric,0),2);
    if debit_value<0 or credit_value<0 or not ((debit_value>0 and credit_value=0) or (credit_value>0 and debit_value=0)) then
      raise exception 'INVALID_JOURNAL_LINE line=%',line_number;
    end if;
    select company_id into account_company from public.ac_accounts where id=(line->>'account_id')::uuid and active=true;
    if account_company is null or account_company<>company_row.id then raise exception 'INVALID_ACCOUNT line=%',line_number; end if;
    insert into public.ac_journal_lines(journal_id,line_no,account_id,description,debit,credit,partner_id,due_date,tax_code,cost_center,production_batch,project_code)
    values(journal_row.id,line_number,(line->>'account_id')::uuid,nullif(trim(line->>'description'),''),debit_value,credit_value,
      nullif(line->>'partner_id','')::uuid,nullif(line->>'due_date','')::date,nullif(trim(line->>'tax_code'),''),
      nullif(trim(line->>'cost_center'),''),nullif(trim(line->>'production_batch'),''),nullif(trim(line->>'project_code'),''));
    total_debit:=total_debit+debit_value; total_credit:=total_credit+credit_value;
  end loop;
  if total_debit<=0 or total_debit<>total_credit then raise exception 'JOURNAL_NOT_BALANCED debit=% credit=%',total_debit,total_credit; end if;
  insert into public.ac_audit_log(company_id,action,entity_type,entity_id,actor_username,actor_level,after_data)
  values(company_row.id,case when p_submit then 'JOURNAL_SUBMIT' else 'JOURNAL_DRAFT' end,'journal',journal_row.id::text,p_actor,'',to_jsonb(journal_row));
  return journal_row;
end $$;

create or replace function public.ac_approve_journal(p_journal_id uuid,p_actor text,p_actor_level text)
returns public.ac_journal_entries language plpgsql security definer set search_path=public as $$
declare journal_row public.ac_journal_entries%rowtype; level_number integer;
begin
  level_number:=coalesce(nullif(regexp_replace(p_actor_level,'[^0-9]','','g'),''),'0')::integer;
  if level_number<5 then raise exception 'C5_REQUIRED'; end if;
  select * into journal_row from public.ac_journal_entries where id=p_journal_id for update;
  if not found then raise exception 'JOURNAL_NOT_FOUND'; end if;
  if journal_row.created_by=p_actor then raise exception 'MAKER_CANNOT_APPROVE_OWN_JOURNAL'; end if;
  if journal_row.status<>'pending_approval' then raise exception 'JOURNAL_NOT_PENDING'; end if;
  journal_row:=public.ac_post_journal(p_journal_id,p_actor);
  insert into public.ac_audit_log(company_id,action,entity_type,entity_id,actor_username,actor_level,after_data)
  values(journal_row.company_id,'JOURNAL_APPROVE','journal',journal_row.id::text,p_actor,p_actor_level,to_jsonb(journal_row));
  return journal_row;
end $$;

create or replace function public.ac_reject_journal(p_journal_id uuid,p_actor text,p_actor_level text,p_reason text)
returns public.ac_journal_entries language plpgsql security definer set search_path=public as $$
declare journal_row public.ac_journal_entries%rowtype; level_number integer;
begin
  level_number:=coalesce(nullif(regexp_replace(p_actor_level,'[^0-9]','','g'),''),'0')::integer;
  if level_number<5 then raise exception 'C5_REQUIRED'; end if;
  if nullif(trim(p_reason),'') is null then raise exception 'REJECTION_REASON_REQUIRED'; end if;
  select * into journal_row from public.ac_journal_entries where id=p_journal_id for update;
  if not found or journal_row.status<>'pending_approval' then raise exception 'JOURNAL_NOT_PENDING'; end if;
  if journal_row.created_by=p_actor then raise exception 'MAKER_CANNOT_REVIEW_OWN_JOURNAL'; end if;
  update public.ac_journal_entries set status='rejected',rejection_reason=trim(p_reason),approved_by=p_actor,approved_at=now(),row_version=row_version+1 where id=p_journal_id returning * into journal_row;
  insert into public.ac_audit_log(company_id,action,entity_type,entity_id,actor_username,actor_level,after_data)
  values(journal_row.company_id,'JOURNAL_REJECT','journal',journal_row.id::text,p_actor,p_actor_level,to_jsonb(journal_row));
  return journal_row;
end $$;

-- Actor identity and level are supplied only by the trusted web server.
revoke execute on function public.ac_create_journal(text,date,text,text,text,text,jsonb,text,boolean) from public, anon, authenticated;
revoke execute on function public.ac_approve_journal(uuid,text,text) from public, anon, authenticated;
revoke execute on function public.ac_reject_journal(uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.ac_create_journal(text,date,text,text,text,text,jsonb,text,boolean) to service_role;
grant execute on function public.ac_approve_journal(uuid,text,text) to service_role;
grant execute on function public.ac_reject_journal(uuid,text,text,text) to service_role;

commit;



----------------------------------------------------------------------------------------
-- PF ACCOUNTING PAYMENT ALLOCATIONS
-- Source: supabase_pf_accounting_payments.sql
----------------------------------------------------------------------------------------

-- PF Accounting: weekly cash / bank-transfer allocation.
-- Safe to run more than once in Supabase SQL Editor.

create table if not exists public.ac_payment_allocations (
  id bigint generated by default as identity primary key,
  company_key text not null default 'pismai-main',
  week_start date not null,
  week_end date not null,
  employee_key text not null,
  employee_kind text not null check (employee_kind in ('production', 'time')),
  employee_id text,
  emp_code text not null,
  fullname text not null,
  group_label text not null,
  payment_method text not null check (payment_method in ('cash', 'transfer')),
  net_amount numeric(14,2) not null default 0 check (net_amount >= 0),
  updated_by text not null,
  updated_at timestamptz not null default now(),
  constraint ac_payment_allocations_valid_week check (week_start <= week_end),
  constraint ac_payment_allocations_unique_employee_week unique (company_key, week_start, week_end, employee_key)
);

create index if not exists idx_ac_payment_allocations_week
  on public.ac_payment_allocations(company_key, week_start desc, week_end desc, payment_method);

alter table public.ac_payment_allocations enable row level security;
revoke all on public.ac_payment_allocations from anon, authenticated;
grant select, insert, update, delete on public.ac_payment_allocations to service_role;
grant usage, select on sequence public.ac_payment_allocations_id_seq to service_role;

create or replace function public.ac_payment_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_ac_payment_touch_updated_at on public.ac_payment_allocations;
create trigger trg_ac_payment_touch_updated_at
before update on public.ac_payment_allocations
for each row execute function public.ac_payment_touch_updated_at();



----------------------------------------------------------------------------------------
-- FINAL SCHEMA RELOAD / CHECK
-- Source: generated
----------------------------------------------------------------------------------------

notify pgrst, 'reload schema';

select '01 main database schema finished' as status;




-- Numeric inventories in the existing Pismai project. Run once in Supabase SQL Editor.
-- C3 read / C4 write checks remain in report_server.py. Browser roles cannot access
-- these tables or execute their mutation functions, including through PostgREST.
begin;

create table if not exists public.stock_items (
  id bigint generated by default as identity primary key,
  category text not null check (category in ('packaging', 'supplies', 'office')),
  name text not null check (length(trim(name)) between 1 and 160),
  specification text not null default '' check (length(specification) <= 200),
  size text not null default '' check (length(size) <= 120),
  unit text not null check (length(trim(unit)) between 1 and 40),
  balance_qty numeric(18,3) not null default 0 check (balance_qty >= 0),
  inventory_value numeric(28,6) not null default 0 check (inventory_value >= 0),
  average_unit_cost numeric(24,8) generated always as
    (case when balance_qty > 0 then round(inventory_value / balance_qty, 8) else 0 end) stored,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, category),
  check (balance_qty > 0 or inventory_value = 0)
);

create unique index if not exists idx_stock_item_identity
on public.stock_items (category, lower(trim(name)), lower(trim(specification)), lower(trim(size)), lower(trim(unit)));

create table if not exists public.stock_movements (
  id bigint generated by default as identity primary key,
  category text not null check (category in ('packaging', 'supplies', 'office')),
  item_id bigint not null,
  client_uid text not null check (client_uid ~ '^[A-Za-z0-9._:-]{8,160}$'),
  type text not null check (type in ('receipt', 'issue')),
  quantity numeric(18,3) not null check (quantity > 0),
  -- Receipt price is entered by staff; issue price is the moving-average cost.
  unit_price numeric(24,8) not null check (unit_price >= 0),
  total_amount numeric(28,6) not null check (total_amount >= 0),
  balance_after numeric(18,3) not null check (balance_after >= 0),
  inventory_value_after numeric(28,6) not null check (inventory_value_after >= 0),
  item_name text not null,
  specification text not null default '',
  size text not null default '',
  unit text not null,
  delivery_note text not null default '' check (length(delivery_note) <= 120),
  supplier text not null default '' check (length(supplier) <= 160),
  recipient text not null default '' check (length(recipient) <= 160),
  note text not null default '' check (length(note) <= 1000),
  occurred_on date not null,
  created_by text not null,
  created_at timestamptz not null default now(),
  foreign key (item_id, category) references public.stock_items(id, category) on delete restrict,
  unique (category, client_uid),
  check ((type = 'receipt' and length(trim(supplier)) > 0) or
         (type = 'issue' and length(trim(recipient)) > 0))
);

create index if not exists idx_stock_movements_category_date
on public.stock_movements (category, created_at desc, id desc);
create index if not exists idx_stock_movements_item
on public.stock_movements (item_id, created_at desc, id desc);

alter table public.stock_items enable row level security;
alter table public.stock_movements enable row level security;
revoke all on public.stock_items, public.stock_movements from public, anon, authenticated, service_role;
grant select on public.stock_items, public.stock_movements to service_role;

-- A single statement snapshot prevents a concurrent receipt/issue from pairing
-- old balances with newer history. There is no PostgREST collection row cap here.
create or replace function public.stock_inventory_snapshot(p_category text)
returns jsonb language plpgsql stable security definer set search_path = pg_catalog, public as $$
begin
  if p_category is null or p_category not in ('packaging', 'supplies', 'office') then
    raise exception 'STOCK_INVALID_CATEGORY';
  end if;
  return jsonb_build_object(
    'items', coalesce((select jsonb_agg(to_jsonb(i) order by i.name, i.id)
                      from public.stock_items i where i.category = p_category), '[]'::jsonb),
    'movements', coalesce((select jsonb_agg(to_jsonb(m) order by m.created_at desc, m.id desc)
                          from public.stock_movements m where m.category = p_category), '[]'::jsonb)
  );
end $$;

create or replace function public.stock_create_item(
  p_category text, p_name text, p_specification text, p_size text, p_unit text, p_actor text
) returns public.stock_items
language plpgsql security definer set search_path = pg_catalog, public as $$
declare saved public.stock_items%rowtype;
begin
  if p_category is null or p_category not in ('packaging', 'supplies', 'office')
     or p_name is null or length(trim(p_name)) not between 1 and 160
     or p_unit is null or length(trim(p_unit)) not between 1 and 40
     or length(coalesce(p_specification,'')) > 200 or length(coalesce(p_size,'')) > 120
     or p_actor is null or length(trim(p_actor)) not between 1 and 120 then
    raise exception 'STOCK_INVALID_ITEM';
  end if;
  insert into public.stock_items(category, name, specification, size, unit, created_by)
  values (p_category, trim(p_name), trim(coalesce(p_specification,'')), trim(coalesce(p_size,'')), trim(p_unit), trim(p_actor))
  returning * into saved;
  return saved;
end $$;

create or replace function public.stock_record_movement(
  p_category text, p_item_id bigint, p_type text, p_quantity numeric, p_unit_price numeric,
  p_delivery_note text, p_supplier text, p_recipient text, p_note text,
  p_occurred_on date, p_client_uid text, p_actor text
) returns public.stock_movements
language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  item public.stock_items%rowtype;
  saved public.stock_movements%rowtype;
  amount numeric(28,6);
  cost numeric(24,8);
  next_qty numeric(18,3);
  next_value numeric(28,6);
begin
  if p_category is null or p_category not in ('packaging', 'supplies', 'office')
     or p_type is null or p_type not in ('receipt', 'issue')
     or p_quantity is null or p_quantity::text in ('NaN','Infinity','-Infinity')
     or p_quantity <= 0 or p_quantity > 1000000000 or p_quantity <> round(p_quantity,3)
     or p_item_id is null or p_item_id <= 0 or p_occurred_on is null
     or p_client_uid is null or p_client_uid !~ '^[A-Za-z0-9._:-]{8,160}$'
     or p_actor is null or length(trim(p_actor)) not between 1 and 120
     or length(coalesce(p_delivery_note,'')) > 120 or length(coalesce(p_supplier,'')) > 160
     or length(coalesce(p_recipient,'')) > 160 or length(coalesce(p_note,'')) > 1000 then
    raise exception 'STOCK_INVALID_MOVEMENT';
  end if;
  if p_type = 'receipt' and
     (p_unit_price is null or p_unit_price::text in ('NaN','Infinity','-Infinity')
      or p_unit_price < 0 or p_unit_price > 1000000000 or p_unit_price <> round(p_unit_price,4)
      or length(trim(coalesce(p_supplier,''))) = 0) then
    raise exception 'STOCK_INVALID_RECEIPT';
  end if;
  if p_type = 'issue' and (length(trim(coalesce(p_recipient,''))) = 0 or p_unit_price is not null) then
    raise exception 'STOCK_INVALID_ISSUE';
  end if;

  -- Serialize retries of the same request, even when they target different items.
  -- The row lock below separately serializes different requests for the same item.
  perform pg_advisory_xact_lock(hashtextextended(p_category || ':' || p_client_uid, 0));
  select * into saved from public.stock_movements
    where category = p_category and client_uid = p_client_uid;
  if found then
    if saved.item_id <> p_item_id or saved.type <> p_type or saved.quantity <> p_quantity
       or (p_type = 'receipt' and saved.unit_price <> p_unit_price)
       or saved.delivery_note <> coalesce(p_delivery_note,'') or saved.supplier <> coalesce(p_supplier,'')
       or saved.recipient <> coalesce(p_recipient,'') or saved.note <> coalesce(p_note,'')
       or saved.occurred_on <> p_occurred_on or saved.created_by <> trim(p_actor) then
      raise exception 'STOCK_IDEMPOTENCY_CONFLICT';
    end if;
    return saved;
  end if;

  select * into item from public.stock_items
    where id = p_item_id and category = p_category for update;
  if not found then raise exception 'STOCK_ITEM_NOT_FOUND'; end if;
  if p_type = 'receipt' then
    cost := p_unit_price;
    amount := round(p_quantity * p_unit_price, 6);
    next_qty := item.balance_qty + p_quantity;
    next_value := item.inventory_value + amount;
  else
    if p_quantity > item.balance_qty then raise exception 'STOCK_INSUFFICIENT'; end if;
    cost := round(item.inventory_value / item.balance_qty, 8);
    next_qty := item.balance_qty - p_quantity;
    -- Clear the exact residual when issuing the last units, avoiding rounding dust.
    amount := case when next_qty = 0 then item.inventory_value
                   else round(item.inventory_value * p_quantity / item.balance_qty, 6) end;
    next_value := item.inventory_value - amount;
  end if;
  insert into public.stock_movements(
    category, item_id, client_uid, type, quantity, unit_price, total_amount, balance_after, inventory_value_after,
    item_name, specification, size, unit, delivery_note, supplier, recipient, note, occurred_on, created_by
  ) values (
    p_category, item.id, p_client_uid, p_type, p_quantity, cost, amount, next_qty, next_value,
    item.name, item.specification, item.size, item.unit, coalesce(p_delivery_note,''), coalesce(p_supplier,''),
    coalesce(p_recipient,''), coalesce(p_note,''), p_occurred_on, trim(p_actor)
  ) returning * into saved;
  update public.stock_items set balance_qty = next_qty, inventory_value = next_value, updated_at = now()
    where id = item.id;
  -- The ledger and cached balances commit together; a failure rolls both back.
  return saved;
end $$;

revoke all on function public.stock_inventory_snapshot(text) from public, anon, authenticated, service_role;
revoke all on function public.stock_create_item(text,text,text,text,text,text) from public, anon, authenticated, service_role;
revoke all on function public.stock_record_movement(text,bigint,text,numeric,numeric,text,text,text,text,date,text,text) from public, anon, authenticated, service_role;
grant execute on function public.stock_inventory_snapshot(text) to service_role;
grant execute on function public.stock_create_item(text,text,text,text,text,text) to service_role;
grant execute on function public.stock_record_movement(text,bigint,text,numeric,numeric,text,text,text,text,date,text,text) to service_role;

notify pgrst, 'reload schema';
commit;
