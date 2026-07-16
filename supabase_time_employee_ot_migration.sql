alter table public.time_employees
  add column if not exists ot_hourly_rate numeric(12,2) not null default 50;

update public.time_employees
set ot_hourly_rate = 50
where ot_hourly_rate is null;

create index if not exists idx_time_employees_employee_type
  on public.time_employees(employee_type);
