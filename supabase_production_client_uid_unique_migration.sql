-- Prevent the same browser production record from ever being stored twice.
-- Run duplicate cleanup/verification before creating this index. The index
-- intentionally fails closed if duplicate client_uid values still exist.

select
  raw_payload->>'client_uid' as client_uid,
  array_agg(id order by id) as duplicate_ids,
  count(*) as duplicate_count
from public.production_records
where coalesce(raw_payload->>'client_uid', '') <> ''
group by raw_payload->>'client_uid'
having count(*) > 1
order by min(id);

create unique index if not exists production_records_client_uid_unique
  on public.production_records ((raw_payload->>'client_uid'))
  where coalesce(raw_payload->>'client_uid', '') <> '';
