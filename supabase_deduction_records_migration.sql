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

create index if not exists idx_deduction_records_kind_range
  on public.deduction_records(employee_kind, start_date, end_date);

create index if not exists idx_deduction_records_employee
  on public.deduction_records(employee_kind, employee_id, emp_code);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_deduction_records_updated_at on public.deduction_records;
create trigger trg_deduction_records_updated_at
before update on public.deduction_records
for each row execute function public.set_updated_at();

alter table public.deduction_records enable row level security;

grant select, insert, update, delete on public.deduction_records to service_role;
grant usage, select on sequence public.deduction_records_id_seq to service_role;
