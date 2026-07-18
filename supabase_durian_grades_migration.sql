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
