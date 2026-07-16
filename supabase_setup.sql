create extension if not exists citext;

create table if not exists public.account_users (
  id bigserial primary key,
  username citext not null unique,
  password_hash text not null,
  fullname text not null,
  role text not null default 'operator',
  user_level text not null default 'C1',
  status text not null default 'Active',
  created_by text,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
  closed_at timestamptz
);

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
  updated_at timestamptz not null default now()
);

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

create table if not exists public.audit_logs (
  id bigserial primary key,
  action text not null,
  module text,
  description text,
  created_by text,
  user_fullname text,
  ip_address text,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_employees_emp_code on public.employees(emp_code);
create index if not exists idx_employees_pay_group on public.employees(pay_group);
create index if not exists idx_time_employees_emp_code on public.time_employees(emp_code);
create index if not exists idx_time_employees_employee_type on public.time_employees(employee_type);
create index if not exists idx_production_records_date on public.production_records(record_date);
create index if not exists idx_production_records_employee on public.production_records(employee_id);
create index if not exists idx_production_records_pay_group on public.production_records(pay_group);
create index if not exists idx_production_records_fruit_type on public.production_records(fruit_type);
create index if not exists idx_deduction_records_kind_range on public.deduction_records(employee_kind, start_date, end_date);
create index if not exists idx_deduction_records_employee on public.deduction_records(employee_kind, employee_id, emp_code);
create index if not exists idx_wage_rates_type_date on public.wage_rates(item_type, effective_date);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);

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

alter table public.account_users enable row level security;
alter table public.employees enable row level security;
alter table public.time_employees enable row level security;
alter table public.wage_rates enable row level security;
alter table public.production_sessions enable row level security;
alter table public.production_records enable row level security;
alter table public.time_records enable row level security;
alter table public.deduction_records enable row level security;
alter table public.audit_logs enable row level security;

grant select, insert, update, delete on public.deduction_records to service_role;
grant usage, select on sequence public.deduction_records_id_seq to service_role;
