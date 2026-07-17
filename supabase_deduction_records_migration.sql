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

create index if not exists idx_deduction_applications_date
  on public.deduction_applications(employee_kind, applied_date);

create index if not exists idx_deduction_applications_record
  on public.deduction_applications(deduction_id, status);

-- Preserve deductions created before the two-step workflow as already applied.
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
    set status = case
      when already_applied + requested >= amount then 'Completed'
      else 'Pending'
    end,
    updated_by = nullif(trim(p_created_by), '')
    where id = deduction_row.id;

    return next inserted_row;
  end loop;
end;
$$;

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
alter table public.deduction_applications enable row level security;

grant select, insert, update, delete on public.deduction_records to service_role;
grant usage, select on sequence public.deduction_records_id_seq to service_role;
grant select, insert, update, delete on public.deduction_applications to service_role;
grant usage, select on sequence public.deduction_applications_id_seq to service_role;
grant execute on function public.apply_deduction_batch(date, text, jsonb) to service_role;
