-- Apply before deploying the recruitment-group UI/API. Existing rows remain NULL.
begin;
alter table public.time_employees
  add column if not exists recruitment_group text;
alter table public.time_employees
  drop constraint if exists time_employees_recruitment_group_check;
alter table public.time_employees
  add constraint time_employees_recruitment_group_check
  check (recruitment_group in ('factory', 'champ'));
commit;
notify pgrst, 'reload schema';
