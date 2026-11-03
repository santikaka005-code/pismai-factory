-- APWS contest update only: santikaka005@gmail.com / kdkgrnwxbcxsdnfngqjk
-- Preserve business rows. Apply the missing schema in a single transaction.
begin;
set local lock_timeout='15s';
set local statement_timeout='120s';

-- SOURCE: supabase_accounting_rpc_migration.sql

create or replace function public.ac_create_journal(
  p_company_key text,
  p_entry_date date,
  p_journal_type text,
  p_reference text,
  p_description text,
  p_document_no text,
  p_lines jsonb,
  p_actor text,
  p_submit boolean default true
) returns public.ac_journal_entries
language plpgsql security definer set search_path=public as $$
declare
  company_row public.ac_companies%rowtype;
  period_row public.ac_periods%rowtype;
  journal_row public.ac_journal_entries%rowtype;
  line jsonb;
  line_number integer := 0;
  total_debit numeric(18,2) := 0;
  total_credit numeric(18,2) := 0;
  account_company uuid;
  debit_value numeric(18,2);
  credit_value numeric(18,2);
begin
  select * into company_row from public.ac_companies where company_key=p_company_key and active=true;
  if not found then raise exception 'ACCOUNTING_COMPANY_NOT_FOUND'; end if;
  select * into period_row from public.ac_periods
  where company_id=company_row.id and p_entry_date between start_date and end_date for update;
  if not found then raise exception 'ACCOUNTING_PERIOD_NOT_FOUND'; end if;
  if period_row.status='closed' then raise exception 'ACCOUNTING_PERIOD_CLOSED'; end if;
  if jsonb_typeof(p_lines)<>'array' or jsonb_array_length(p_lines)<2 then raise exception 'JOURNAL_REQUIRES_TWO_LINES'; end if;

  insert into public.ac_journal_entries(
    company_id,period_id,journal_no,journal_type,entry_date,reference,description,status,
    source_type,source_id,created_by,submitted_by,submitted_at
  ) values (
    company_row.id,period_row.id,
    'JV-'||to_char(p_entry_date,'YYYYMM')||'-'||lpad(nextval('public.ac_journal_running_seq')::text,7,'0'),
    p_journal_type,p_entry_date,nullif(trim(p_reference),''),trim(p_description),
    case when p_submit then 'pending_approval' else 'draft' end,
    'arc_manual',null,trim(p_actor),case when p_submit then trim(p_actor) end,case when p_submit then now() end
  ) returning * into journal_row;

  for line in select value from jsonb_array_elements(p_lines) loop
    line_number := line_number+1;
    debit_value := round(coalesce((line->>'debit')::numeric,0),2);
    credit_value := round(coalesce((line->>'credit')::numeric,0),2);
    if debit_value<0 or credit_value<0 or not ((debit_value>0 and credit_value=0) or (credit_value>0 and debit_value=0)) then
      raise exception 'INVALID_JOURNAL_LINE line=%',line_number;
    end if;
    select company_id into account_company from public.ac_accounts where id=(line->>'account_id')::uuid and active=true;
    if account_company is null or account_company<>company_row.id then raise exception 'INVALID_ACCOUNT line=%',line_number; end if;
    insert into public.ac_journal_lines(journal_id,line_no,account_id,description,debit,credit,partner_id,due_date,tax_code,cost_center,production_batch,project_code)
    values(journal_row.id,line_number,(line->>'account_id')::uuid,nullif(trim(line->>'description'),''),debit_value,credit_value,
      nullif(line->>'partner_id','')::uuid,nullif(line->>'due_date','')::date,nullif(trim(line->>'tax_code'),''),
      nullif(trim(line->>'cost_center'),''),nullif(trim(line->>'production_batch'),''),nullif(trim(line->>'project_code'),''));
    total_debit:=total_debit+debit_value; total_credit:=total_credit+credit_value;
  end loop;
  if total_debit<=0 or total_debit<>total_credit then raise exception 'JOURNAL_NOT_BALANCED debit=% credit=%',total_debit,total_credit; end if;
  insert into public.ac_audit_log(company_id,action,entity_type,entity_id,actor_username,actor_level,after_data)
  values(company_row.id,case when p_submit then 'JOURNAL_SUBMIT' else 'JOURNAL_DRAFT' end,'journal',journal_row.id::text,p_actor,'',to_jsonb(journal_row));
  return journal_row;
end $$;

create or replace function public.ac_approve_journal(p_journal_id uuid,p_actor text,p_actor_level text)
returns public.ac_journal_entries language plpgsql security definer set search_path=public as $$
declare journal_row public.ac_journal_entries%rowtype; level_number integer;
begin
  level_number:=coalesce(nullif(regexp_replace(p_actor_level,'[^0-9]','','g'),''),'0')::integer;
  if level_number<5 then raise exception 'C5_REQUIRED'; end if;
  select * into journal_row from public.ac_journal_entries where id=p_journal_id for update;
  if not found then raise exception 'JOURNAL_NOT_FOUND'; end if;
  if journal_row.created_by=p_actor then raise exception 'MAKER_CANNOT_APPROVE_OWN_JOURNAL'; end if;
  if journal_row.status<>'pending_approval' then raise exception 'JOURNAL_NOT_PENDING'; end if;
  journal_row:=public.ac_post_journal(p_journal_id,p_actor);
  insert into public.ac_audit_log(company_id,action,entity_type,entity_id,actor_username,actor_level,after_data)
  values(journal_row.company_id,'JOURNAL_APPROVE','journal',journal_row.id::text,p_actor,p_actor_level,to_jsonb(journal_row));
  return journal_row;
end $$;

create or replace function public.ac_reject_journal(p_journal_id uuid,p_actor text,p_actor_level text,p_reason text)
returns public.ac_journal_entries language plpgsql security definer set search_path=public as $$
declare journal_row public.ac_journal_entries%rowtype; level_number integer;
begin
  level_number:=coalesce(nullif(regexp_replace(p_actor_level,'[^0-9]','','g'),''),'0')::integer;
  if level_number<5 then raise exception 'C5_REQUIRED'; end if;
  if nullif(trim(p_reason),'') is null then raise exception 'REJECTION_REASON_REQUIRED'; end if;
  select * into journal_row from public.ac_journal_entries where id=p_journal_id for update;
  if not found or journal_row.status<>'pending_approval' then raise exception 'JOURNAL_NOT_PENDING'; end if;
  if journal_row.created_by=p_actor then raise exception 'MAKER_CANNOT_REVIEW_OWN_JOURNAL'; end if;
  update public.ac_journal_entries set status='rejected',rejection_reason=trim(p_reason),approved_by=p_actor,approved_at=now(),row_version=row_version+1 where id=p_journal_id returning * into journal_row;
  insert into public.ac_audit_log(company_id,action,entity_type,entity_id,actor_username,actor_level,after_data)
  values(journal_row.company_id,'JOURNAL_REJECT','journal',journal_row.id::text,p_actor,p_actor_level,to_jsonb(journal_row));
  return journal_row;
end $$;

-- Actor identity and level are supplied only by the trusted web server.
revoke execute on function public.ac_create_journal(text,date,text,text,text,text,jsonb,text,boolean) from public, anon, authenticated;
revoke execute on function public.ac_approve_journal(uuid,text,text) from public, anon, authenticated;
revoke execute on function public.ac_reject_journal(uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.ac_create_journal(text,date,text,text,text,text,jsonb,text,boolean) to service_role;
grant execute on function public.ac_approve_journal(uuid,text,text) to service_role;
grant execute on function public.ac_reject_journal(uuid,text,text,text) to service_role;


-- SOURCE: supabase_durian_grades_migration.sql
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


-- SOURCE: supabase_time_employee_recruitment_group_migration.sql
-- Apply before deploying the recruitment-group UI/API. Existing rows remain NULL.

alter table public.time_employees
  add column if not exists recruitment_group text;
alter table public.time_employees
  drop constraint if exists time_employees_recruitment_group_check;
alter table public.time_employees
  add constraint time_employees_recruitment_group_check
  check (recruitment_group in ('factory', 'champ'));

notify pgrst, 'reload schema';


-- SOURCE: supabase_stock_inventory_migration.sql
-- Numeric inventories in the existing Pismai project. Run once in Supabase SQL Editor.
-- C3 read / C4 write checks remain in report_server.py. Browser roles cannot access
-- these tables or execute their mutation functions, including through PostgREST.

create table if not exists public.stock_items (
  id bigint generated by default as identity primary key,
  category text not null check (category in ('packaging', 'supplies', 'office')),
  name text not null check (length(trim(name)) between 1 and 160),
  specification text not null default '' check (length(specification) <= 200),
  size text not null default '' check (length(size) <= 120),
  unit text not null check (length(trim(unit)) between 1 and 40),
  balance_qty numeric(18,3) not null default 0 check (balance_qty >= 0),
  inventory_value numeric(28,6) not null default 0 check (inventory_value >= 0),
  average_unit_cost numeric(24,8) generated always as
    (case when balance_qty > 0 then round(inventory_value / balance_qty, 8) else 0 end) stored,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, category),
  check (balance_qty > 0 or inventory_value = 0)
);

create unique index if not exists idx_stock_item_identity
on public.stock_items (category, lower(trim(name)), lower(trim(specification)), lower(trim(size)), lower(trim(unit)));

create table if not exists public.stock_movements (
  id bigint generated by default as identity primary key,
  category text not null check (category in ('packaging', 'supplies', 'office')),
  item_id bigint not null,
  client_uid text not null check (client_uid ~ '^[A-Za-z0-9._:-]{8,160}$'),
  type text not null check (type in ('receipt', 'issue')),
  quantity numeric(18,3) not null check (quantity > 0),
  -- Receipt price is entered by staff; issue price is the moving-average cost.
  unit_price numeric(24,8) not null check (unit_price >= 0),
  total_amount numeric(28,6) not null check (total_amount >= 0),
  balance_after numeric(18,3) not null check (balance_after >= 0),
  inventory_value_after numeric(28,6) not null check (inventory_value_after >= 0),
  item_name text not null,
  specification text not null default '',
  size text not null default '',
  unit text not null,
  delivery_note text not null default '' check (length(delivery_note) <= 120),
  supplier text not null default '' check (length(supplier) <= 160),
  recipient text not null default '' check (length(recipient) <= 160),
  note text not null default '' check (length(note) <= 1000),
  occurred_on date not null,
  created_by text not null,
  created_at timestamptz not null default now(),
  foreign key (item_id, category) references public.stock_items(id, category) on delete restrict,
  unique (category, client_uid),
  check ((type = 'receipt' and length(trim(supplier)) > 0) or
         (type = 'issue' and length(trim(recipient)) > 0))
);

create index if not exists idx_stock_movements_category_date
on public.stock_movements (category, created_at desc, id desc);
create index if not exists idx_stock_movements_item
on public.stock_movements (item_id, created_at desc, id desc);

alter table public.stock_items enable row level security;
alter table public.stock_movements enable row level security;
revoke all on public.stock_items, public.stock_movements from public, anon, authenticated, service_role;
grant select on public.stock_items, public.stock_movements to service_role;

-- A single statement snapshot prevents a concurrent receipt/issue from pairing
-- old balances with newer history. There is no PostgREST collection row cap here.
create or replace function public.stock_inventory_snapshot(p_category text)
returns jsonb language plpgsql stable security definer set search_path = pg_catalog, public as $$
begin
  if p_category is null or p_category not in ('packaging', 'supplies', 'office') then
    raise exception 'STOCK_INVALID_CATEGORY';
  end if;
  return jsonb_build_object(
    'items', coalesce((select jsonb_agg(to_jsonb(i) order by i.name, i.id)
                      from public.stock_items i where i.category = p_category), '[]'::jsonb),
    'movements', coalesce((select jsonb_agg(to_jsonb(m) order by m.created_at desc, m.id desc)
                          from public.stock_movements m where m.category = p_category), '[]'::jsonb)
  );
end $$;

create or replace function public.stock_create_item(
  p_category text, p_name text, p_specification text, p_size text, p_unit text, p_actor text
) returns public.stock_items
language plpgsql security definer set search_path = pg_catalog, public as $$
declare saved public.stock_items%rowtype;
begin
  if p_category is null or p_category not in ('packaging', 'supplies', 'office')
     or p_name is null or length(trim(p_name)) not between 1 and 160
     or p_unit is null or length(trim(p_unit)) not between 1 and 40
     or length(coalesce(p_specification,'')) > 200 or length(coalesce(p_size,'')) > 120
     or p_actor is null or length(trim(p_actor)) not between 1 and 120 then
    raise exception 'STOCK_INVALID_ITEM';
  end if;
  insert into public.stock_items(category, name, specification, size, unit, created_by)
  values (p_category, trim(p_name), trim(coalesce(p_specification,'')), trim(coalesce(p_size,'')), trim(p_unit), trim(p_actor))
  returning * into saved;
  return saved;
end $$;

create or replace function public.stock_record_movement(
  p_category text, p_item_id bigint, p_type text, p_quantity numeric, p_unit_price numeric,
  p_delivery_note text, p_supplier text, p_recipient text, p_note text,
  p_occurred_on date, p_client_uid text, p_actor text
) returns public.stock_movements
language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  item public.stock_items%rowtype;
  saved public.stock_movements%rowtype;
  amount numeric(28,6);
  cost numeric(24,8);
  next_qty numeric(18,3);
  next_value numeric(28,6);
begin
  if p_category is null or p_category not in ('packaging', 'supplies', 'office')
     or p_type is null or p_type not in ('receipt', 'issue')
     or p_quantity is null or p_quantity::text in ('NaN','Infinity','-Infinity')
     or p_quantity <= 0 or p_quantity > 1000000000 or p_quantity <> round(p_quantity,3)
     or p_item_id is null or p_item_id <= 0 or p_occurred_on is null
     or p_client_uid is null or p_client_uid !~ '^[A-Za-z0-9._:-]{8,160}$'
     or p_actor is null or length(trim(p_actor)) not between 1 and 120
     or length(coalesce(p_delivery_note,'')) > 120 or length(coalesce(p_supplier,'')) > 160
     or length(coalesce(p_recipient,'')) > 160 or length(coalesce(p_note,'')) > 1000 then
    raise exception 'STOCK_INVALID_MOVEMENT';
  end if;
  if p_type = 'receipt' and
     (p_unit_price is null or p_unit_price::text in ('NaN','Infinity','-Infinity')
      or p_unit_price < 0 or p_unit_price > 1000000000 or p_unit_price <> round(p_unit_price,4)
      or length(trim(coalesce(p_supplier,''))) = 0) then
    raise exception 'STOCK_INVALID_RECEIPT';
  end if;
  if p_type = 'issue' and (length(trim(coalesce(p_recipient,''))) = 0 or p_unit_price is not null) then
    raise exception 'STOCK_INVALID_ISSUE';
  end if;

  -- Serialize retries of the same request, even when they target different items.
  -- The row lock below separately serializes different requests for the same item.
  perform pg_advisory_xact_lock(hashtextextended(p_category || ':' || p_client_uid, 0));
  select * into saved from public.stock_movements
    where category = p_category and client_uid = p_client_uid;
  if found then
    if saved.item_id <> p_item_id or saved.type <> p_type or saved.quantity <> p_quantity
       or (p_type = 'receipt' and saved.unit_price <> p_unit_price)
       or saved.delivery_note <> coalesce(p_delivery_note,'') or saved.supplier <> coalesce(p_supplier,'')
       or saved.recipient <> coalesce(p_recipient,'') or saved.note <> coalesce(p_note,'')
       or saved.occurred_on <> p_occurred_on or saved.created_by <> trim(p_actor) then
      raise exception 'STOCK_IDEMPOTENCY_CONFLICT';
    end if;
    return saved;
  end if;

  select * into item from public.stock_items
    where id = p_item_id and category = p_category for update;
  if not found then raise exception 'STOCK_ITEM_NOT_FOUND'; end if;
  if p_type = 'receipt' then
    cost := p_unit_price;
    amount := round(p_quantity * p_unit_price, 6);
    next_qty := item.balance_qty + p_quantity;
    next_value := item.inventory_value + amount;
  else
    if p_quantity > item.balance_qty then raise exception 'STOCK_INSUFFICIENT'; end if;
    cost := round(item.inventory_value / item.balance_qty, 8);
    next_qty := item.balance_qty - p_quantity;
    -- Clear the exact residual when issuing the last units, avoiding rounding dust.
    amount := case when next_qty = 0 then item.inventory_value
                   else round(item.inventory_value * p_quantity / item.balance_qty, 6) end;
    next_value := item.inventory_value - amount;
  end if;
  insert into public.stock_movements(
    category, item_id, client_uid, type, quantity, unit_price, total_amount, balance_after, inventory_value_after,
    item_name, specification, size, unit, delivery_note, supplier, recipient, note, occurred_on, created_by
  ) values (
    p_category, item.id, p_client_uid, p_type, p_quantity, cost, amount, next_qty, next_value,
    item.name, item.specification, item.size, item.unit, coalesce(p_delivery_note,''), coalesce(p_supplier,''),
    coalesce(p_recipient,''), coalesce(p_note,''), p_occurred_on, trim(p_actor)
  ) returning * into saved;
  update public.stock_items set balance_qty = next_qty, inventory_value = next_value, updated_at = now()
    where id = item.id;
  -- The ledger and cached balances commit together; a failure rolls both back.
  return saved;
end $$;

revoke all on function public.stock_inventory_snapshot(text) from public, anon, authenticated, service_role;
revoke all on function public.stock_create_item(text,text,text,text,text,text) from public, anon, authenticated, service_role;
revoke all on function public.stock_record_movement(text,bigint,text,numeric,numeric,text,text,text,text,date,text,text) from public, anon, authenticated, service_role;
grant execute on function public.stock_inventory_snapshot(text) to service_role;
grant execute on function public.stock_create_item(text,text,text,text,text,text) to service_role;
grant execute on function public.stock_record_movement(text,bigint,text,numeric,numeric,text,text,text,text,date,text,text) to service_role;

notify pgrst, 'reload schema';


-- SOURCE: supabase_fruit_stock_issues_migration.sql
-- Run after supabase_inbound_receiving_migration.sql. Safe to rerun.
-- Preserves receipts/prices and does not post financial transactions.

create table if not exists public.inbound_issues (
  id bigint generated by default as identity primary key,
  client_uid text not null unique,
  fruit_id bigint not null references public.inbound_fruits(id) on delete restrict,
  fruit_name text not null,
  weight_kg numeric(14,2) not null check (weight_kg > 0),
  total_cost numeric(20,4) not null default 0 check (total_cost >= 0),
  recipient text not null check (length(trim(recipient)) between 1 and 160),
  note text not null default '' check (length(note) <= 1000),
  issued_at timestamptz not null,
  created_by text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.inbound_issue_allocations (
  issue_id bigint not null references public.inbound_issues(id) on delete restrict,
  receipt_id bigint not null references public.inbound_receipts(id) on delete restrict,
  weight_kg numeric(14,2) not null check (weight_kg > 0),
  total_cost numeric(20,4) not null check (total_cost >= 0),
  primary key (issue_id, receipt_id)
);
create index if not exists idx_inbound_issues_fruit on public.inbound_issues(fruit_id);
create index if not exists idx_inbound_allocations_receipt on public.inbound_issue_allocations(receipt_id);
alter table public.inbound_issues enable row level security;
alter table public.inbound_issue_allocations enable row level security;
revoke all on public.inbound_issues, public.inbound_issue_allocations from public, anon, authenticated, service_role;
grant select on public.inbound_issues, public.inbound_issue_allocations to service_role;

create or replace function public.fruit_stock_snapshot()
returns jsonb language sql stable security definer set search_path=pg_catalog,public as $$
  with receipts as (
    select fruit_id, sum(weight_kg) received_weight, sum(total_amount) received_value
    from public.inbound_receipts group by fruit_id
  ), issues as (
    select fruit_id, sum(weight_kg) issued_weight, sum(total_cost) issued_value
    from public.inbound_issues group by fruit_id
  )
  select jsonb_build_object(
    'issue_schema_version',2,
    'balances', coalesce((select jsonb_agg(jsonb_build_object(
      'fruit_id',f.id,'fruit_name',f.name,
      'received_weight',coalesce(r.received_weight,0),
      'issued_weight',coalesce(i.issued_weight,0),
      'balance_weight',coalesce(r.received_weight,0)-coalesce(i.issued_weight,0),
      'inventory_value',coalesce(r.received_value,0)-coalesce(i.issued_value,0)
    ) order by f.name) from public.inbound_fruits f left join receipts r on r.fruit_id=f.id left join issues i on i.fruit_id=f.id),'[]'::jsonb),
    'issues',coalesce((select jsonb_agg(to_jsonb(i) order by i.issued_at desc,i.id desc) from public.inbound_issues i),'[]'::jsonb)
  );
$$;

create or replace function public.fruit_stock_issue(
  p_client_uid text,p_fruit_id bigint,p_weight_kg numeric,p_recipient text,
  p_note text,p_issued_at timestamptz,p_actor text
) returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare
  existing public.inbound_issues%rowtype;
  saved public.inbound_issues%rowtype;
  fruit_name text;
  receipt record;
  left_weight numeric := p_weight_kg;
  taken numeric;
  used_weight numeric;
  used_cost numeric;
  cost numeric;
  cost_total numeric := 0;
begin
  if p_client_uid is null or p_client_uid !~ '^[A-Za-z0-9._:-]{8,160}$'
    or p_fruit_id is null or p_fruit_id <= 0
    or p_weight_kg is null or p_weight_kg::text in ('NaN','Infinity','-Infinity')
    or p_weight_kg <= 0 or p_weight_kg > 100000000 or round(p_weight_kg,2) <> p_weight_kg
    or p_recipient is null or length(trim(p_recipient)) not between 1 and 160
    or p_note is null or length(p_note)>1000
    or p_actor is null or length(trim(p_actor)) not between 1 and 120
    or p_issued_at is null or not isfinite(p_issued_at) then
    raise exception 'FRUIT_INVALID_INPUT';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('fruit-issue:'||p_client_uid,0));
  select * into existing from public.inbound_issues where client_uid=p_client_uid;
  if found then
    if existing.fruit_id is distinct from p_fruit_id or existing.weight_kg is distinct from p_weight_kg
      or existing.recipient is distinct from trim(p_recipient) or existing.note is distinct from p_note
      or existing.issued_at is distinct from p_issued_at or existing.created_by is distinct from p_actor then
      raise exception 'FRUIT_IDEMPOTENCY_CONFLICT';
    end if;
    return to_jsonb(existing);
  end if;
  -- Serialize every issue of the same fruit, including across server processes.
  select name into fruit_name from public.inbound_fruits where id=p_fruit_id for update;
  if not found then raise exception 'FRUIT_NOT_FOUND'; end if;
  insert into public.inbound_issues(client_uid,fruit_id,fruit_name,weight_kg,recipient,note,issued_at,created_by)
    values(p_client_uid,p_fruit_id,fruit_name,p_weight_kg,trim(p_recipient),p_note,p_issued_at,p_actor) returning * into saved;
  for receipt in select * from public.inbound_receipts
    where fruit_id=p_fruit_id and received_at<=p_issued_at order by received_at,id for update
  loop
    select coalesce(sum(weight_kg),0),coalesce(sum(total_cost),0) into used_weight,used_cost
      from public.inbound_issue_allocations where receipt_id=receipt.id;
    taken := least(left_weight,receipt.weight_kg-used_weight);
    if taken<=0 then continue; end if;
    -- Round cumulative cost, then subtract previous allocations so tiny issues
    -- cannot accumulate rounding errors or make the final allocation negative.
    cost := case when taken=receipt.weight_kg-used_weight then receipt.total_amount-used_cost
      else round(receipt.total_amount*(used_weight+taken)/receipt.weight_kg,4)-used_cost end;
    insert into public.inbound_issue_allocations values(saved.id,receipt.id,taken,cost);
    left_weight := left_weight-taken;
    cost_total := cost_total+cost;
    exit when left_weight=0;
  end loop;
  if left_weight>0 then raise exception 'FRUIT_INSUFFICIENT'; end if;
  update public.inbound_issues set total_cost=cost_total where id=saved.id returning * into saved;
  -- Issue and lot allocations are the immutable audit trail, committed together.
  return to_jsonb(saved);
end;
$$;
revoke all on function public.fruit_stock_snapshot() from public,anon,authenticated;
revoke all on function public.fruit_stock_issue(text,bigint,numeric,text,text,timestamptz,text) from public,anon,authenticated;
grant execute on function public.fruit_stock_snapshot() to service_role;
grant execute on function public.fruit_stock_issue(text,bigint,numeric,text,text,timestamptz,text) to service_role;
notify pgrst,'reload schema';


-- SOURCE: supabase_cold_room_stock_migration.sql
-- Cold-room production ledger. Re-runnable; no sample stock and no data deletion.

create table if not exists public.cold_stock_locations (
  room text not null check (room in ('1','2')),
  slot text not null,
  primary key(room,slot)
);
-- Logical location codes, not a declaration of physical room capacity.
insert into public.cold_stock_locations(room,slot)
select r, (case r when '1' then 'A-' else 'B-' end)||lpad(n::text,2,'0')
from unnest(array['1','2']) r cross join generate_series(1,16) n
on conflict do nothing;
create table if not exists public.cold_stock_pallets (
  id bigint generated always as identity primary key,
  product text not null check(length(product) between 1 and 100),
  lot text not null check(length(lot) between 1 and 80),
  owner text not null check(owner in ('own','guest')),
  customer text not null check(length(customer) between 1 and 100),
  boxes integer not null check(boxes between 0 and 1000),
  kg_per_box numeric(10,2) not null default 20 check(kg_per_box=20),
  status text not null check(status in ('pending','stored','closed')),
  room text, slot text,
  version integer not null default 1,
  reference text not null default '',
  created_by text not null, created_at timestamptz not null default now(),
  received_at timestamptz,
  foreign key(room,slot) references public.cold_stock_locations(room,slot),
  check((status='pending' and room is null and slot is null and boxes>0)
    or (status='stored' and room is not null and slot is not null and boxes>0)
    or (status='closed' and boxes=0))
);
create unique index if not exists cold_stock_one_pallet_per_slot on public.cold_stock_pallets(room,slot) where status='stored';
create table if not exists public.cold_stock_movements (
  id bigint generated always as identity primary key,
  client_uid text not null unique,
  request jsonb not null,
  pallet_id bigint not null references public.cold_stock_pallets(id),
  action text not null check(action in ('stage','receive','store','move','dispatch')),
  boxes integer not null check(boxes>0),
  weight numeric(14,2) not null,
  before_state jsonb,
  after_state jsonb not null,
  recipient text not null default '', reference text not null default '',
  created_by text not null, created_at timestamptz not null default now()
);
alter table public.cold_stock_locations enable row level security;
alter table public.cold_stock_pallets enable row level security;
alter table public.cold_stock_movements enable row level security;
revoke all on public.cold_stock_locations,public.cold_stock_pallets,public.cold_stock_movements from public,anon,authenticated,service_role;
grant select on public.cold_stock_locations,public.cold_stock_pallets,public.cold_stock_movements to service_role;

create or replace function public.cold_stock_snapshot() returns jsonb
language sql stable security definer set search_path=pg_catalog,public as $$
  select jsonb_build_object('schema_version',1,
    'locations',coalesce((select jsonb_agg(to_jsonb(l) order by room,slot) from public.cold_stock_locations l),'[]'::jsonb),
    'pallets',coalesce((select jsonb_agg(to_jsonb(p) order by id) from public.cold_stock_pallets p where status<>'closed'),'[]'::jsonb),
    'movements',coalesce((select jsonb_agg(to_jsonb(m)-'request' order by id desc) from public.cold_stock_movements m),'[]'::jsonb));
$$;

create or replace function public.cold_stock_record(p_request jsonb,p_actor text) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare
  a text := p_request->>'action'; uid text := p_request->>'client_uid';
  p public.cold_stock_pallets%rowtype; old_state jsonb;
  m public.cold_stock_movements%rowtype;
  quantity integer; r text:=p_request->>'room'; s text:=p_request->>'slot';
  receiver text:=trim(coalesce(p_request->>'recipient',''));
  ref text:=trim(coalesce(p_request->>'reference',''));
begin
  if p_actor is null or length(trim(p_actor)) not between 1 and 120
    or uid is null or uid !~ '^[A-Za-z0-9._:-]{8,160}$'
    or a is null or a not in ('stage','receive','store','move','dispatch')
    or length(receiver)>160 or length(ref)>160 then raise exception 'COLD_INVALID'; end if;
  -- Serialize short stock transactions across workers; retries share the same ledger key.
  perform pg_advisory_xact_lock(734930215);
  select * into m from public.cold_stock_movements where client_uid=uid;
  if found then
    if m.request<>p_request or m.created_by<>p_actor then raise exception 'COLD_RETRY_CONFLICT'; end if;
    return to_jsonb(m)-'request';
  end if;
  if a in ('receive','stage','dispatch') then
    if coalesce(p_request->>'boxes','') !~ '^[1-9][0-9]{0,3}$' then raise exception 'COLD_INVALID'; end if;
    quantity:=(p_request->>'boxes')::integer;
    if quantity>1000 then raise exception 'COLD_INVALID'; end if;
  end if;
  if a in ('receive','store','move') then
    if not exists(select 1 from public.cold_stock_locations where room=r and slot=s) then raise exception 'COLD_LOCATION'; end if;
    if exists(select 1 from public.cold_stock_pallets where room=r and slot=s and status='stored') then raise exception 'COLD_OCCUPIED'; end if;
  end if;
  if a in ('receive','stage') then
    if length(trim(coalesce(p_request->>'product',''))) not between 1 and 100
      or length(trim(coalesce(p_request->>'lot',''))) not between 1 and 80
      or coalesce(p_request->>'owner','') not in ('own','guest')
      or ((p_request->>'owner')='guest' and length(trim(coalesce(p_request->>'customer',''))) not between 1 and 100)
      then raise exception 'COLD_INVALID'; end if;
    insert into public.cold_stock_pallets(product,lot,owner,customer,boxes,status,room,slot,reference,created_by,received_at)
    values(trim(p_request->>'product'),trim(p_request->>'lot'),p_request->>'owner',
      case when p_request->>'owner'='own' then 'โรงงานเรา' else trim(p_request->>'customer') end,
      quantity,case when a='stage' then 'pending' else 'stored' end,
      case when a='receive' then r end,case when a='receive' then s end,ref,p_actor,
      case when a='receive' then now() end) returning * into p;
  else
    if coalesce(p_request->>'pallet_id','') !~ '^[1-9][0-9]{0,17}$'
      or coalesce(p_request->>'version','') !~ '^[1-9][0-9]{0,8}$' then raise exception 'COLD_INVALID'; end if;
    select * into p from public.cold_stock_pallets where id=(p_request->>'pallet_id')::bigint for update;
    if not found then raise exception 'COLD_NOT_FOUND'; end if;
    if p.version<>(p_request->>'version')::integer then raise exception 'COLD_STALE'; end if;
    old_state:=to_jsonb(p);
    if a='store' then
      if p.status<>'pending' then raise exception 'COLD_STALE'; end if;
      quantity:=p.boxes;
      update public.cold_stock_pallets set status='stored',room=r,slot=s,received_at=now(),version=version+1 where id=p.id returning * into p;
    elsif a='move' then
      if p.status<>'stored' then raise exception 'COLD_STALE'; end if;
      quantity:=p.boxes;
      update public.cold_stock_pallets set room=r,slot=s,version=version+1 where id=p.id returning * into p;
    else
      if p.status<>'stored' or p.boxes<quantity then raise exception 'COLD_INSUFFICIENT'; end if;
      if length(receiver)<1 then raise exception 'COLD_RECIPIENT'; end if;
      update public.cold_stock_pallets set boxes=boxes-quantity,
        status=case when boxes=quantity then 'closed' else 'stored' end,version=version+1 where id=p.id returning * into p;
    end if;
  end if;
  insert into public.cold_stock_movements(client_uid,request,pallet_id,action,boxes,weight,before_state,after_state,recipient,reference,created_by)
    values(uid,p_request,p.id,a,quantity,quantity*p.kg_per_box,old_state,to_jsonb(p),receiver,ref,p_actor) returning * into m;
  return to_jsonb(m)-'request';
end;
$$;
revoke all on function public.cold_stock_snapshot() from public,anon,authenticated;
revoke all on function public.cold_stock_record(jsonb,text) from public,anon,authenticated;
grant execute on function public.cold_stock_snapshot() to service_role;
grant execute on function public.cold_stock_record(jsonb,text) to service_role;
notify pgrst,'reload schema';


-- SOURCE: supabase_cold_sales_migration.sql
-- Run after supabase_cold_room_stock_migration.sql. No demo data; no stock deletion.

alter table public.cold_stock_pallets drop constraint if exists cold_stock_pallets_kg_per_box_check;
alter table public.cold_stock_pallets add constraint cold_stock_pallets_kg_per_box_check check(kg_per_box>0 and kg_per_box<=1000);
create table if not exists public.cold_sale_orders (
 id bigint generated always as identity primary key,
 client_uid text not null unique, request jsonb not null,
 customer jsonb not null, company jsonb not null default '{}',
 bill_date date not null, status text not null default 'waiting' check(status in ('waiting','sold')),
 version integer not null default 1, total numeric(18,2) not null,
 created_by text not null,created_at timestamptz not null default now(),
 confirmed_by text,confirmed_at timestamptz,confirmation_uid text unique,confirmation_request jsonb,reason text not null default ''
);
create table if not exists public.cold_sale_lines (
 id bigint generated always as identity primary key, order_id bigint not null references public.cold_sale_orders(id),
 product text not null, kg_per_box numeric(10,2) not null, boxes integer not null check(boxes>0),
 weight_kg numeric(16,2) not null, price_per_kg numeric(16,2) not null check(price_per_kg>=0), amount numeric(18,2) not null,
 unique(order_id,product,kg_per_box)
);
create table if not exists public.cold_sale_allocations (
 order_id bigint not null references public.cold_sale_orders(id),line_id bigint not null references public.cold_sale_lines(id),
 pallet_id bigint not null references public.cold_stock_pallets(id), boxes integer not null check(boxes>0),
 original_boxes integer not null check(original_boxes>=0), primary key(order_id,pallet_id)
);
create table if not exists public.cold_sale_events (
 id bigint generated always as identity primary key, order_id bigint not null references public.cold_sale_orders(id),
 action text not null,details jsonb not null,actor text not null,created_at timestamptz not null default now()
);
alter table public.cold_sale_orders enable row level security;
alter table public.cold_sale_lines enable row level security;
alter table public.cold_sale_allocations enable row level security;
alter table public.cold_sale_events enable row level security;
revoke all on public.cold_sale_orders,public.cold_sale_lines,public.cold_sale_allocations,public.cold_sale_events from public,anon,authenticated,service_role;
grant select on public.cold_sale_orders,public.cold_sale_lines,public.cold_sale_allocations,public.cold_sale_events to service_role;
create or replace function public.cold_sale_snapshot() returns jsonb language sql stable security definer set search_path=pg_catalog,public as $$
 select jsonb_build_object('schema_version',1,
 'pallets',coalesce((select jsonb_agg(to_jsonb(p)||jsonb_build_object('reserved_boxes',coalesce((select sum(a.boxes) from public.cold_sale_allocations a join public.cold_sale_orders o on o.id=a.order_id where a.pallet_id=p.id and o.status='waiting'),0)) order by p.received_at,p.id) from public.cold_stock_pallets p where p.status='stored'),'[]'::jsonb),
 'orders',coalesce((select jsonb_agg(to_jsonb(o)-'request'-'confirmation_request'||jsonb_build_object('lines',coalesce((select jsonb_agg(to_jsonb(l) order by l.id) from public.cold_sale_lines l where l.order_id=o.id),'[]'::jsonb),'allocations',coalesce((select jsonb_agg(to_jsonb(a)||jsonb_build_object('lot',p.lot,'room',p.room,'slot',p.slot,'received_at',p.received_at,'kg_per_box',p.kg_per_box,'product',p.product) order by p.received_at,p.id) from public.cold_sale_allocations a join public.cold_stock_pallets p on p.id=a.pallet_id where a.order_id=o.id),'[]'::jsonb)) order by o.id desc) from public.cold_sale_orders o),'[]'::jsonb));
$$;
create or replace function public.cold_sale_create(p_request jsonb,p_actor text) returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare o public.cold_sale_orders%rowtype;l public.cold_sale_lines%rowtype;p public.cold_stock_pallets%rowtype;r jsonb;uid text:=p_request->>'client_uid';w numeric;pack numeric;price numeric;need integer;available integer;take integer;
begin
 if uid is null or uid !~ '^[A-Za-z0-9._:-]{8,160}$' or length(trim(coalesce(p_actor,''))) not between 1 and 120 or jsonb_typeof(p_request->'customer') is distinct from 'object' or length(trim(coalesce(p_request#>>'{customer,name}',''))) not between 1 and 160 or jsonb_typeof(p_request->'lines') is distinct from 'array' or jsonb_array_length(p_request->'lines') not between 1 and 100 or coalesce(p_request->>'bill_date','') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'SALE_INVALID';end if;
 perform pg_advisory_xact_lock(734930215);
 select * into o from public.cold_sale_orders where client_uid=uid;
 if found then if o.request<>p_request or o.created_by<>p_actor then raise exception 'SALE_RETRY_CONFLICT';end if;return to_jsonb(o)-'request'-'confirmation_request';end if;
 insert into public.cold_sale_orders(client_uid,request,customer,company,bill_date,total,created_by) values(uid,p_request,p_request->'customer',coalesce(p_request->'company','{}'),(p_request->>'bill_date')::date,0,p_actor) returning * into o;
 for r in select value from jsonb_array_elements(p_request->'lines') loop
  if length(trim(coalesce(r->>'product',''))) not between 1 and 100 or coalesce(r->>'kg_per_box','') !~ '^[0-9]{1,4}(\.[0-9]{1,2})?$' or coalesce(r->>'weight_kg','') !~ '^[0-9]{1,8}(\.[0-9]{1,2})?$' or coalesce(r->>'price_per_kg','') !~ '^[0-9]{1,7}(\.[0-9]{1,2})?$' then raise exception 'SALE_INVALID';end if;
  pack:=(r->>'kg_per_box')::numeric;w:=(r->>'weight_kg')::numeric;price:=(r->>'price_per_kg')::numeric;
  if pack<=0 or pack>1000 or w<=0 or price<0 or price>1000000 then raise exception 'SALE_INVALID';end if;
  if mod(w,pack)<>0 then raise exception 'SALE_FULL_BOX';end if;need:=(w/pack)::integer;
  if exists(select 1 from public.cold_sale_lines where order_id=o.id and product=trim(r->>'product') and kg_per_box=pack) then raise exception 'SALE_DUPLICATE';end if;
  insert into public.cold_sale_lines(order_id,product,kg_per_box,boxes,weight_kg,price_per_kg,amount) values(o.id,trim(r->>'product'),pack,need,w,price,round(w*price,2)) returning * into l;
  for p in select * from public.cold_stock_pallets where status='stored' and owner='own' and product=l.product and kg_per_box=pack order by received_at asc nulls last,id for update loop
   select p.boxes-coalesce(sum(a.boxes),0) into available from public.cold_sale_allocations a join public.cold_sale_orders so on so.id=a.order_id where a.pallet_id=p.id and so.status='waiting';
   take:=least(need,available);if take>0 then insert into public.cold_sale_allocations(order_id,line_id,pallet_id,boxes,original_boxes) values(o.id,l.id,p.id,take,take);need:=need-take;end if;exit when need=0;
  end loop;
  if need>0 then raise exception 'SALE_INSUFFICIENT';end if;
 end loop;
 update public.cold_sale_orders set total=(select sum(amount) from public.cold_sale_lines where order_id=o.id) where id=o.id returning * into o;
 insert into public.cold_sale_events(order_id,action,details,actor) values(o.id,'reserve',(select jsonb_agg(to_jsonb(a)) from public.cold_sale_allocations a where order_id=o.id),p_actor);
 return to_jsonb(o)-'request'-'confirmation_request';
end;$$;
create or replace function public.cold_sale_confirm(p_request jsonb,p_actor text) returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare o public.cold_sale_orders%rowtype;l public.cold_sale_lines%rowtype;p public.cold_stock_pallets%rowtype;r jsonb;uid text:=p_request->>'client_uid';n integer;reserved integer;changed boolean;before_plan jsonb;
begin
 if uid is null or uid !~ '^[A-Za-z0-9._:-]{8,160}$' or coalesce(p_request->>'order_id','') !~ '^[1-9][0-9]{0,17}$' or coalesce(p_request->>'version','') !~ '^[1-9][0-9]{0,8}$' or length(trim(coalesce(p_actor,''))) not between 1 and 120 or jsonb_typeof(p_request->'allocations') is distinct from 'array' or jsonb_array_length(p_request->'allocations') not between 1 and 100 or length(coalesce(p_request->>'reason',''))>1000 then raise exception 'SALE_INVALID';end if;
 perform pg_advisory_xact_lock(734930215);
 select * into o from public.cold_sale_orders where id=(p_request->>'order_id')::bigint for update;if not found then raise exception 'SALE_NOT_FOUND';end if;
 if o.status='sold' then if o.confirmation_uid=uid and o.confirmation_request=p_request and o.confirmed_by=p_actor then return to_jsonb(o)-'request'-'confirmation_request';end if;raise exception 'SALE_STALE';end if;
 if o.version<>(p_request->>'version')::integer then raise exception 'SALE_STALE';end if;
 select jsonb_agg(to_jsonb(a) order by pallet_id) into before_plan from public.cold_sale_allocations a where order_id=o.id;
 changed:=false;
 for r in select value from jsonb_array_elements(p_request->'allocations') loop
  if coalesce(r->>'pallet_id','') !~ '^[1-9][0-9]{0,17}$' or coalesce(r->>'boxes','') !~ '^[1-9][0-9]{0,3}$' then raise exception 'SALE_INVALID';end if;
  if (select count(*) from jsonb_array_elements(p_request->'allocations') a where a->>'pallet_id'=r->>'pallet_id')>1 then raise exception 'SALE_INVALID';end if;
  select * into p from public.cold_stock_pallets where id=(r->>'pallet_id')::bigint for update;
  if not found or p.status<>'stored' or p.owner<>'own' then raise exception 'SALE_STALE';end if;
  select * into l from public.cold_sale_lines where order_id=o.id and product=p.product and kg_per_box=p.kg_per_box;if not found then raise exception 'SALE_WRONG_PRODUCT';end if;
  n:=(r->>'boxes')::integer;
  select coalesce(sum(a.boxes),0) into reserved from public.cold_sale_allocations a join public.cold_sale_orders so on so.id=a.order_id where a.pallet_id=p.id and so.status='waiting' and so.id<>o.id;
  if n>p.boxes-reserved then raise exception 'SALE_INSUFFICIENT';end if;
  if not exists(select 1 from public.cold_sale_allocations where order_id=o.id and pallet_id=p.id and boxes=n) then changed:=true;end if;
 end loop;
 if (select count(*) from public.cold_sale_allocations where order_id=o.id)<>jsonb_array_length(p_request->'allocations') then changed:=true;end if;
 for l in select * from public.cold_sale_lines where order_id=o.id loop
  select coalesce(sum((a->>'boxes')::integer),0) into n from jsonb_array_elements(p_request->'allocations') a join public.cold_stock_pallets cp on cp.id=(a->>'pallet_id')::bigint where cp.product=l.product and cp.kg_per_box=l.kg_per_box;
  if n<>l.boxes then raise exception 'SALE_QUANTITY';end if;
 end loop;
 if changed and length(trim(coalesce(p_request->>'reason','')))=0 then raise exception 'SALE_REASON';end if;
 delete from public.cold_sale_allocations where order_id=o.id;
 for r in select value from jsonb_array_elements(p_request->'allocations') loop
  select * into p from public.cold_stock_pallets where id=(r->>'pallet_id')::bigint;
  select * into l from public.cold_sale_lines where order_id=o.id and product=p.product and kg_per_box=p.kg_per_box;
  insert into public.cold_sale_allocations(order_id,line_id,pallet_id,boxes,original_boxes) values(o.id,l.id,p.id,(r->>'boxes')::integer,coalesce((select (a->>'boxes')::integer from jsonb_array_elements(before_plan) a where (a->>'pallet_id')::bigint=p.id),0));
 end loop;
 update public.cold_sale_orders set status='sold',version=version+1,confirmed_by=p_actor,confirmed_at=now(),confirmation_uid=uid,confirmation_request=p_request,reason=coalesce(p_request->>'reason','') where id=o.id;
 for r in select value from jsonb_array_elements(p_request->'allocations') loop
  select * into p from public.cold_stock_pallets where id=(r->>'pallet_id')::bigint;
  -- Other orders may reserve this same pallet: dedicated atomic update, never expire reservations.
  insert into public.cold_stock_movements(client_uid,request,pallet_id,action,boxes,weight,before_state,after_state,recipient,reference,created_by)
   values('sale-'||o.id||'-'||p.id,p_request,p.id,'dispatch',(r->>'boxes')::integer,(r->>'boxes')::integer*p.kg_per_box,to_jsonb(p),to_jsonb(p),o.customer->>'name','BL-'||o.id,p_actor);
  update public.cold_stock_pallets set boxes=boxes-(r->>'boxes')::integer,status=case when boxes=(r->>'boxes')::integer then 'closed' else 'stored' end,version=version+1 where id=p.id returning * into p;
  update public.cold_stock_movements set after_state=to_jsonb(p) where client_uid='sale-'||o.id||'-'||p.id;
 end loop;
 insert into public.cold_sale_events(order_id,action,details,actor) values(o.id,'confirm',jsonb_build_object('before',before_plan,'after',p_request->'allocations','reason',p_request->>'reason'),p_actor);
 select * into o from public.cold_sale_orders where id=o.id;
 return to_jsonb(o)-'request'-'confirmation_request';
end;$$;
create or replace function public.cold_stock_record(p_request jsonb,p_actor text) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare
  a text := p_request->>'action'; uid text := p_request->>'client_uid';
  p public.cold_stock_pallets%rowtype; old_state jsonb;
  m public.cold_stock_movements%rowtype;
  pack_weight numeric(10,2);
  quantity integer; r text:=p_request->>'room'; s text:=p_request->>'slot';
  receiver text:=trim(coalesce(p_request->>'recipient',''));
  ref text:=trim(coalesce(p_request->>'reference',''));
begin
  if p_actor is null or length(trim(p_actor)) not between 1 and 120
    or uid is null or uid !~ '^[A-Za-z0-9._:-]{8,160}$'
    or a is null or a not in ('stage','receive','store','move','dispatch')
    or length(receiver)>160 or length(ref)>160 then raise exception 'COLD_INVALID'; end if;
  -- Serialize short stock transactions across workers; retries share the same ledger key.
  perform pg_advisory_xact_lock(734930215);
  select * into m from public.cold_stock_movements where client_uid=uid;
  if found then
    if m.request<>p_request or m.created_by<>p_actor then raise exception 'COLD_RETRY_CONFLICT'; end if;
    return to_jsonb(m)-'request';
  end if;
  if a in ('receive','stage','dispatch') then
    if coalesce(p_request->>'boxes','') !~ '^[1-9][0-9]{0,3}$' then raise exception 'COLD_INVALID'; end if;
    quantity:=(p_request->>'boxes')::integer;
    if quantity>1000 then raise exception 'COLD_INVALID'; end if;
  end if;
  if a in ('receive','store','move') then
    if not exists(select 1 from public.cold_stock_locations where room=r and slot=s) then raise exception 'COLD_LOCATION'; end if;
    if exists(select 1 from public.cold_stock_pallets where room=r and slot=s and status='stored') then raise exception 'COLD_OCCUPIED'; end if;
  end if;
  if a in ('receive','stage') then
    if coalesce(p_request->>'kg_per_box','20') !~ '^[0-9]{1,4}(\.[0-9]{1,2})?$' then raise exception 'COLD_INVALID'; end if;
    pack_weight:=coalesce(p_request->>'kg_per_box','20')::numeric;
    if pack_weight<=0 or pack_weight>1000 then raise exception 'COLD_INVALID'; end if;
    if length(trim(coalesce(p_request->>'product',''))) not between 1 and 100
      or length(trim(coalesce(p_request->>'lot',''))) not between 1 and 80
      or coalesce(p_request->>'owner','') not in ('own','guest')
      or ((p_request->>'owner')='guest' and length(trim(coalesce(p_request->>'customer',''))) not between 1 and 100)
      then raise exception 'COLD_INVALID'; end if;
    insert into public.cold_stock_pallets(product,lot,owner,customer,boxes,kg_per_box,status,room,slot,reference,created_by,received_at)
    values(trim(p_request->>'product'),trim(p_request->>'lot'),p_request->>'owner',
      case when p_request->>'owner'='own' then 'โรงงานเรา' else trim(p_request->>'customer') end,
      quantity,pack_weight,case when a='stage' then 'pending' else 'stored' end,
      case when a='receive' then r end,case when a='receive' then s end,ref,p_actor,
      case when a='receive' then now() end) returning * into p;
  else
    if coalesce(p_request->>'pallet_id','') !~ '^[1-9][0-9]{0,17}$'
      or coalesce(p_request->>'version','') !~ '^[1-9][0-9]{0,8}$' then raise exception 'COLD_INVALID'; end if;
    select * into p from public.cold_stock_pallets where id=(p_request->>'pallet_id')::bigint for update;
    if not found then raise exception 'COLD_NOT_FOUND'; end if;
    if p.version<>(p_request->>'version')::integer then raise exception 'COLD_STALE'; end if;
    old_state:=to_jsonb(p);
    if a='store' then
      if p.status<>'pending' then raise exception 'COLD_STALE'; end if;
      quantity:=p.boxes;
      update public.cold_stock_pallets set status='stored',room=r,slot=s,received_at=now(),version=version+1 where id=p.id returning * into p;
    elsif a='move' then
      if p.status<>'stored' then raise exception 'COLD_STALE'; end if;
      quantity:=p.boxes;
      update public.cold_stock_pallets set room=r,slot=s,version=version+1 where id=p.id returning * into p;
    else
      if p.status<>'stored' or p.boxes<quantity then raise exception 'COLD_INSUFFICIENT'; end if;
      if length(receiver)<1 then raise exception 'COLD_RECIPIENT'; end if;
      if exists(select 1 from public.cold_sale_allocations a join public.cold_sale_orders o on o.id=a.order_id where a.pallet_id=p.id and o.status='waiting') then raise exception 'SALE_RESERVED'; end if;
      update public.cold_stock_pallets set boxes=boxes-quantity,
        status=case when boxes=quantity then 'closed' else 'stored' end,version=version+1 where id=p.id returning * into p;
    end if;
  end if;
  insert into public.cold_stock_movements(client_uid,request,pallet_id,action,boxes,weight,before_state,after_state,recipient,reference,created_by)
    values(uid,p_request,p.id,a,quantity,quantity*p.kg_per_box,old_state,to_jsonb(p),receiver,ref,p_actor) returning * into m;
  return to_jsonb(m)-'request';
end;
$$;
create or replace function public.cold_stock_record_v2(p_request jsonb,p_actor text) returns jsonb
language sql security definer set search_path=pg_catalog,public as $$ select public.cold_stock_record(p_request,p_actor); $$;
revoke all on function public.cold_stock_record_v2(jsonb,text) from public,anon,authenticated;
grant execute on function public.cold_stock_record_v2(jsonb,text) to service_role;
revoke all on function public.cold_sale_snapshot() from public,anon,authenticated;
revoke all on function public.cold_sale_create(jsonb,text) from public,anon,authenticated;
revoke all on function public.cold_sale_confirm(jsonb,text) from public,anon,authenticated;
grant execute on function public.cold_sale_snapshot(),public.cold_sale_create(jsonb,text),public.cold_sale_confirm(jsonb,text) to service_role;
notify pgrst,'reload schema';


-- SOURCE: supabase_rpc_permissions_hardening.sql
-- Pismai: restrict legacy SECURITY DEFINER mutations to the web server.
-- Run this entire file in the existing project's Supabase SQL Editor.
-- This changes function privileges only; it does not modify business rows.
-- Missing optional accounting functions are skipped. Safe to run again.

do $rpc_permissions_hardening$
declare
  function_identity text;
begin
  foreach function_identity in array array[
    'public.apply_deduction_batch(date,text,jsonb)',
    'public.ac_post_journal(uuid,text)',
    'public.ac_close_period(uuid,text)',
    'public.ac_create_journal(text,date,text,text,text,text,jsonb,text,boolean)',
    'public.ac_approve_journal(uuid,text,text)',
    'public.ac_reject_journal(uuid,text,text,text)'
  ] loop
    if to_regprocedure(function_identity) is not null then
      execute format('revoke execute on function %s from public, anon, authenticated', function_identity);
      execute format('grant execute on function %s to service_role', function_identity);
    end if;
  end loop;
end;
$rpc_permissions_hardening$;

notify pgrst, 'reload schema';


-- SOURCE: supabase_backup_archive_migration.sql
-- Private server-side archive storage used before Backup / Clear operations.
-- Service-role requests can access this bucket; no public policies are added.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pismai-backup-archives',
  'pismai-backup-archives',
  false,
  104857600,
  array['application/json']::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

notify pgrst, 'reload schema';
commit;
select 'APWS schema update committed' as result;