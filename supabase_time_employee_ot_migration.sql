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
