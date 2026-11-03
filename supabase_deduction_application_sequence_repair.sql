-- PISMAI FACTORY - DEDUCTION APPLICATION ID COUNTER REPAIR
-- Run this file by itself in the existing Supabase project's SQL Editor.
-- Repairs a stale generated-ID counter after importing rows with explicit IDs.
-- Does not insert, update, delete, or renumber any financial records.
-- Safe to rerun: an ahead counter and an empty table retain their next ID.
-- Keep the lock wait short; retry later if another transaction is using the table.

do $deduction_application_sequence_repair$
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

  -- Block ordinary inserts until this statement commits or rolls back.
  lock table public.deduction_applications in access exclusive mode;
  sequence_name := pg_get_serial_sequence('public.deduction_applications', 'id');
  if sequence_name is null then
    raise exception 'deduction_applications.id has no owned sequence; no changes were made';
  end if;

  select seqincrement, seqcache, seqmax, seqcycle
  into sequence_increment, sequence_cache, sequence_max, sequence_cycles
  from pg_sequence
  where seqrelid = sequence_name::regclass;
  if sequence_increment is null or sequence_increment <= 0 or sequence_cycles then
    raise exception 'Expected a positive, non-cycling deduction application ID sequence; no changes were made';
  end if;

  -- Take the sequence DDL lock without resetting its value or cache setting.
  -- This also blocks direct nextval calls while its current state is inspected.
  execute format('alter sequence %s cache %s', sequence_name, sequence_cache);
  execute format('select last_value, is_called from %s', sequence_name)
    into sequence_last, sequence_called;
  select max(id) into maximum_id from public.deduction_applications;

  if maximum_id is not null then
    -- Numeric arithmetic detects exhaustion without overflowing bigint.
    current_next := sequence_last::numeric
      + case when sequence_called then sequence_increment else 0 end;
    required_next := greatest(maximum_id::numeric + sequence_increment, current_next);
    if required_next > sequence_max then
      raise exception 'Deduction application ID sequence is exhausted; no changes were made';
    end if;
    -- Always RESTART for a populated table to invalidate cached IDs held by
    -- other connections, even if the sequence's on-disk value is already ahead.
    -- RESTART is transactional, so a later error/rollback restores the counter.
    -- is_called=false means the next generated ID will be required_next itself.
    execute format('alter sequence %s restart with %s', sequence_name, required_next);
  end if;
end;
$deduction_application_sequence_repair$;

select 'Deduction application ID counter checked; existing records unchanged' as status;
