-- Pismai: add cloud-sync payload storage without altering existing data.
-- Run this entire file in Supabase Dashboard > SQL Editor.

alter table public.production_sessions
  add column if not exists raw_payload jsonb not null default '{}'::jsonb;

alter table public.production_records
  add column if not exists raw_payload jsonb not null default '{}'::jsonb;

alter table public.time_records
  add column if not exists raw_payload jsonb not null default '{}'::jsonb;

