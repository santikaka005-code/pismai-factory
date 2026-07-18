begin;

create table if not exists public.accounting_workspaces (
  company_key text primary key,
  revision bigint not null default 0,
  workspace jsonb not null default '{}'::jsonb,
  updated_by text not null,
  updated_at timestamptz not null default now(),
  constraint accounting_workspace_object check (jsonb_typeof(workspace) = 'object')
);

create table if not exists public.accounting_change_log (
  id bigserial primary key,
  company_key text not null,
  revision bigint not null,
  action text not null,
  actor_username text not null,
  actor_level text not null,
  workspace_hash text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_accounting_change_log_company_revision
  on public.accounting_change_log(company_key, revision desc);

alter table public.accounting_workspaces enable row level security;
alter table public.accounting_change_log enable row level security;

revoke all on public.accounting_workspaces from anon, authenticated;
revoke all on public.accounting_change_log from anon, authenticated;
grant select, insert, update on public.accounting_workspaces to service_role;
grant select, insert on public.accounting_change_log to service_role;
grant usage, select on sequence public.accounting_change_log_id_seq to service_role;

commit;

-- ARC full accounting schema -------------------------------------------------
begin;
create extension if not exists pgcrypto;

create table if not exists public.ac_companies (
  id uuid primary key default gen_random_uuid(),
  company_key text not null unique,
  legal_name text not null,
  tax_id varchar(13),
  branch_code varchar(5) not null default '00000',
  vat_registered boolean not null default false,
  paid_capital numeric(18,2) not null default 0 check (paid_capital >= 0),
  fiscal_year_end_month smallint not null default 12 check (fiscal_year_end_month between 1 and 12),
  fiscal_year_end_day smallint not null default 31 check (fiscal_year_end_day between 1 and 31),
  base_currency char(3) not null default 'THB',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_periods (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.ac_companies(id) on delete restrict,
  period_code varchar(7) not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'open' check (status in ('open','review','closed')),
  closed_by text,
  closed_at timestamptz,
  reopened_by text,
  reopened_at timestamptz,
  reopen_reason text,
  created_at timestamptz not null default now(),
  unique(company_id, period_code),
  check (start_date <= end_date)
);

create table if not exists public.ac_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.ac_companies(id) on delete restrict,
  code text not null,
  name_th text not null,
  name_en text,
  account_type text not null check (account_type in ('asset','liability','equity','revenue','expense')),
  parent_id uuid references public.ac_accounts(id) on delete restrict,
  normal_side text not null check (normal_side in ('debit','credit')),
  is_contra boolean not null default false,
  control_type text check (control_type is null or control_type in ('ar','ap','bank','cash','inventory','fixed_asset','input_vat','output_vat','wht','retained_earnings')),
  active boolean not null default true,
  system_account boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, code)
);

create table if not exists public.ac_partners (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.ac_companies(id) on delete restrict,
  partner_code text not null,
  partner_type text not null check (partner_type in ('customer','vendor','both','employee','government')),
  legal_name text not null,
  tax_id varchar(13),
  branch_code varchar(5) not null default '00000',
  address text,
  email text,
  phone text,
  payment_terms_days integer not null default 0 check (payment_terms_days >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, partner_code)
);

create table if not exists public.ac_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.ac_companies(id) on delete restrict,
  document_type text not null,
  document_no text not null,
  document_date date not null,
  partner_id uuid references public.ac_partners(id) on delete restrict,
  tax_invoice_no text,
  tax_invoice_date date,
  subtotal numeric(18,2) not null default 0,
  vat_amount numeric(18,2) not null default 0,
  total_amount numeric(18,2) not null default 0,
  currency char(3) not null default 'THB',
  attachment_path text,
  attachment_hash text,
  status text not null default 'draft' check (status in ('draft','verified','posted','void')),
  created_by text not null,
  verified_by text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, document_type, document_no),
  check (subtotal >= 0 and vat_amount >= 0 and total_amount >= 0)
);

create sequence if not exists public.ac_journal_running_seq;
create table if not exists public.ac_journal_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.ac_companies(id) on delete restrict,
  period_id uuid not null references public.ac_periods(id) on delete restrict,
  journal_no text not null,
  journal_type text not null default 'general' check (journal_type in ('general','sales','purchase','receipt','payment','payroll','inventory','production','adjustment','closing','reversal')),
  entry_date date not null,
  reference text,
  description text not null,
  document_id uuid references public.ac_documents(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft','pending_approval','posted','reversed','rejected')),
  source_type text,
  source_id text,
  reversal_of uuid references public.ac_journal_entries(id) on delete restrict,
  created_by text not null,
  created_at timestamptz not null default now(),
  submitted_by text,
  submitted_at timestamptz,
  approved_by text,
  approved_at timestamptz,
  posted_by text,
  posted_at timestamptz,
  reversed_by text,
  reversed_at timestamptz,
  rejection_reason text,
  row_version bigint not null default 1,
  unique(company_id, journal_no),
  unique(company_id, source_type, source_id)
);

create table if not exists public.ac_journal_lines (
  id uuid primary key default gen_random_uuid(),
  journal_id uuid not null references public.ac_journal_entries(id) on delete cascade,
  line_no integer not null check (line_no > 0),
  account_id uuid not null references public.ac_accounts(id) on delete restrict,
  description text,
  debit numeric(18,2) not null default 0 check (debit >= 0),
  credit numeric(18,2) not null default 0 check (credit >= 0),
  partner_id uuid references public.ac_partners(id) on delete restrict,
  due_date date,
  tax_code text,
  cost_center text,
  production_batch text,
  project_code text,
  created_at timestamptz not null default now(),
  unique(journal_id, line_no),
  check ((debit > 0 and credit = 0) or (credit > 0 and debit = 0))
);

create table if not exists public.ac_approvals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.ac_companies(id) on delete restrict,
  entity_type text not null,
  entity_id uuid not null,
  sequence_no integer not null default 1,
  requested_by text not null,
  requested_at timestamptz not null default now(),
  decided_by text,
  decided_at timestamptz,
  decision text not null default 'pending' check (decision in ('pending','approved','rejected')),
  comment text,
  check (decided_by is null or decided_by <> requested_by),
  unique(entity_type, entity_id, sequence_no)
);

create table if not exists public.ac_open_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.ac_companies(id) on delete restrict,
  partner_id uuid not null references public.ac_partners(id) on delete restrict,
  journal_line_id uuid not null references public.ac_journal_lines(id) on delete restrict,
  item_type text not null check (item_type in ('receivable','payable')),
  document_no text not null,
  document_date date not null,
  due_date date not null,
  original_amount numeric(18,2) not null check (original_amount > 0),
  outstanding_amount numeric(18,2) not null check (outstanding_amount >= 0),
  status text not null default 'open' check (status in ('open','partial','settled','written_off')),
  created_at timestamptz not null default now()
);

create table if not exists public.ac_settlements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.ac_companies(id) on delete restrict,
  open_item_id uuid not null references public.ac_open_items(id) on delete restrict,
  payment_journal_line_id uuid not null references public.ac_journal_lines(id) on delete restrict,
  settlement_date date not null,
  amount numeric(18,2) not null check (amount > 0),
  created_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.ac_tax_rules (
  id uuid primary key default gen_random_uuid(),
  tax_type text not null check (tax_type in ('vat','wht','cit','sso')),
  code text not null,
  label_th text not null,
  rate numeric(9,6) not null check (rate >= 0),
  effective_from date not null,
  effective_to date,
  conditions jsonb not null default '{}'::jsonb,
  official_source_url text not null,
  verified_at timestamptz not null,
  verified_by text not null,
  active boolean not null default true,
  unique(tax_type, code, effective_from),
  check (effective_to is null or effective_to >= effective_from)
);

create table if not exists public.ac_tax_transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.ac_companies(id) on delete restrict,
  document_id uuid references public.ac_documents(id) on delete restrict,
  journal_line_id uuid references public.ac_journal_lines(id) on delete restrict,
  partner_id uuid references public.ac_partners(id) on delete restrict,
  tax_type text not null check (tax_type in ('input_vat','output_vat','wht_payable','wht_credit','cit')),
  tax_period varchar(7) not null,
  tax_base numeric(18,2) not null default 0,
  rate numeric(9,6) not null default 0,
  tax_amount numeric(18,2) not null default 0,
  deductible boolean,
  disallow_reason text,
  filing_status text not null default 'unfiled' check (filing_status in ('unfiled','prepared','filed','amended')),
  filing_reference text,
  created_at timestamptz not null default now(),
  check (tax_base >= 0 and rate >= 0 and tax_amount >= 0)
);

create table if not exists public.ac_tax_filings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.ac_companies(id) on delete restrict,
  form_type text not null,
  tax_period varchar(7) not null,
  due_date date not null,
  taxable_base numeric(18,2) not null default 0,
  tax_amount numeric(18,2) not null default 0,
  surcharge numeric(18,2) not null default 0,
  penalty numeric(18,2) not null default 0,
  status text not null default 'draft' check (status in ('draft','review','approved','filed','amended')),
  filing_reference text,
  filed_at timestamptz,
  filed_by text,
  attachment_path text,
  unique(company_id, form_type, tax_period, status)
);

create table if not exists public.ac_bank_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.ac_companies(id) on delete restrict,
  ledger_account_id uuid not null references public.ac_accounts(id) on delete restrict,
  bank_name text not null,
  account_name text not null,
  masked_account_no text not null,
  active boolean not null default true,
  unique(company_id, ledger_account_id)
);

create table if not exists public.ac_bank_statement_lines (
  id uuid primary key default gen_random_uuid(),
  bank_account_id uuid not null references public.ac_bank_accounts(id) on delete restrict,
  statement_date date not null,
  reference text,
  description text,
  amount numeric(18,2) not null check (amount <> 0),
  running_balance numeric(18,2),
  import_batch text not null,
  source_hash text not null,
  matched boolean not null default false,
  created_at timestamptz not null default now(),
  unique(bank_account_id, source_hash)
);

create table if not exists public.ac_bank_matches (
  id uuid primary key default gen_random_uuid(),
  statement_line_id uuid not null references public.ac_bank_statement_lines(id) on delete restrict,
  journal_line_id uuid not null references public.ac_journal_lines(id) on delete restrict,
  matched_amount numeric(18,2) not null check (matched_amount > 0),
  matched_by text not null,
  matched_at timestamptz not null default now(),
  unique(statement_line_id, journal_line_id)
);

create table if not exists public.ac_inventory_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.ac_companies(id) on delete restrict,
  sku text not null,
  name text not null,
  item_type text not null check (item_type in ('raw_material','packaging','wip','finished_goods','consumable')),
  uom text not null,
  inventory_account_id uuid not null references public.ac_accounts(id) on delete restrict,
  cogs_account_id uuid not null references public.ac_accounts(id) on delete restrict,
  costing_method text not null default 'weighted_average' check (costing_method in ('weighted_average','fifo','standard')),
  standard_cost numeric(18,4) not null default 0,
  active boolean not null default true,
  unique(company_id, sku)
);

create table if not exists public.ac_inventory_movements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.ac_companies(id) on delete restrict,
  item_id uuid not null references public.ac_inventory_items(id) on delete restrict,
  movement_date date not null,
  movement_type text not null check (movement_type in ('purchase','issue_to_production','production_receipt','sale','return','adjustment','waste','count')),
  quantity numeric(18,4) not null check (quantity <> 0),
  unit_cost numeric(18,4) not null default 0 check (unit_cost >= 0),
  total_cost numeric(18,2) generated always as (round(quantity * unit_cost, 2)) stored,
  lot_no text,
  warehouse text,
  production_batch text,
  journal_id uuid references public.ac_journal_entries(id) on delete restrict,
  source_type text,
  source_id text,
  created_by text not null,
  created_at timestamptz not null default now(),
  unique(company_id, source_type, source_id, item_id)
);

create table if not exists public.ac_production_cost_batches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.ac_companies(id) on delete restrict,
  batch_no text not null,
  production_date date not null,
  fruit_type text,
  input_quantity numeric(18,4) not null default 0,
  output_quantity numeric(18,4) not null default 0,
  waste_quantity numeric(18,4) not null default 0,
  direct_material numeric(18,2) not null default 0,
  direct_labor numeric(18,2) not null default 0,
  factory_overhead numeric(18,2) not null default 0,
  total_cost numeric(18,2) generated always as (direct_material + direct_labor + factory_overhead) stored,
  unit_cost numeric(18,4),
  status text not null default 'draft' check (status in ('draft','calculated','approved','posted')),
  journal_id uuid references public.ac_journal_entries(id) on delete restrict,
  approved_by text,
  approved_at timestamptz,
  unique(company_id, batch_no)
);

create table if not exists public.ac_fixed_assets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.ac_companies(id) on delete restrict,
  asset_code text not null,
  asset_name text not null,
  acquisition_date date not null,
  available_for_use_date date not null,
  cost numeric(18,2) not null check (cost > 0),
  residual_value numeric(18,2) not null default 0 check (residual_value >= 0),
  useful_life_months integer not null check (useful_life_months > 0),
  depreciation_method text not null default 'straight_line' check (depreciation_method in ('straight_line')),
  asset_account_id uuid not null references public.ac_accounts(id) on delete restrict,
  accumulated_depreciation_account_id uuid not null references public.ac_accounts(id) on delete restrict,
  depreciation_expense_account_id uuid not null references public.ac_accounts(id) on delete restrict,
  status text not null default 'active' check (status in ('active','disposed','fully_depreciated')),
  disposal_date date,
  disposal_proceeds numeric(18,2),
  unique(company_id, asset_code),
  check (residual_value <= cost)
);

create table if not exists public.ac_depreciation_runs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.ac_companies(id) on delete restrict,
  asset_id uuid not null references public.ac_fixed_assets(id) on delete restrict,
  period_code varchar(7) not null,
  depreciation_amount numeric(18,2) not null check (depreciation_amount >= 0),
  accumulated_amount numeric(18,2) not null check (accumulated_amount >= 0),
  journal_id uuid references public.ac_journal_entries(id) on delete restrict,
  status text not null default 'calculated' check (status in ('calculated','posted','reversed')),
  unique(asset_id, period_code)
);

create table if not exists public.ac_audit_log (
  id bigserial primary key,
  company_id uuid references public.ac_companies(id) on delete restrict,
  action text not null,
  entity_type text not null,
  entity_id text,
  actor_username text not null,
  actor_level text not null,
  before_data jsonb,
  after_data jsonb,
  request_id uuid default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create index if not exists idx_ac_journal_entries_period_status on public.ac_journal_entries(company_id, period_id, status);
create index if not exists idx_ac_journal_lines_account on public.ac_journal_lines(account_id, journal_id);
create index if not exists idx_ac_open_items_due on public.ac_open_items(company_id, item_type, status, due_date);
create index if not exists idx_ac_tax_transactions_period on public.ac_tax_transactions(company_id, tax_type, tax_period);
create index if not exists idx_ac_inventory_movements_item_date on public.ac_inventory_movements(item_id, movement_date);
create index if not exists idx_ac_audit_log_entity on public.ac_audit_log(company_id, entity_type, entity_id, created_at desc);

create or replace function public.ac_touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create or replace function public.ac_guard_journal_line_change() returns trigger language plpgsql as $$
declare entry_status text; period_status text;
begin
  select j.status, p.status into entry_status, period_status
  from public.ac_journal_entries j join public.ac_periods p on p.id = j.period_id
  where j.id = coalesce(new.journal_id, old.journal_id);
  if period_status = 'closed' then raise exception 'ACCOUNTING_PERIOD_CLOSED'; end if;
  if entry_status in ('posted','reversed') then raise exception 'POSTED_JOURNAL_IMMUTABLE'; end if;
  return coalesce(new, old);
end $$;

create or replace function public.ac_assert_balanced(p_journal_id uuid) returns void language plpgsql as $$
declare total_debit numeric(18,2); total_credit numeric(18,2); line_count integer;
begin
  select coalesce(sum(debit),0), coalesce(sum(credit),0), count(*) into total_debit,total_credit,line_count
  from public.ac_journal_lines where journal_id=p_journal_id;
  if line_count < 2 or total_debit <= 0 or total_debit <> total_credit then
    raise exception 'JOURNAL_NOT_BALANCED debit=% credit=% lines=%', total_debit,total_credit,line_count;
  end if;
end $$;

create or replace function public.ac_post_journal(p_journal_id uuid,p_actor text) returns public.ac_journal_entries
language plpgsql security definer set search_path=public as $$
declare j public.ac_journal_entries%rowtype; p_status text;
begin
  select * into j from public.ac_journal_entries where id=p_journal_id for update;
  if not found then raise exception 'JOURNAL_NOT_FOUND'; end if;
  select status into p_status from public.ac_periods where id=j.period_id;
  if p_status='closed' then raise exception 'ACCOUNTING_PERIOD_CLOSED'; end if;
  if j.status not in ('draft','pending_approval') then raise exception 'INVALID_JOURNAL_STATUS'; end if;
  if j.created_by=p_actor then raise exception 'MAKER_CANNOT_APPROVE_OWN_JOURNAL'; end if;
  perform public.ac_assert_balanced(j.id);
  update public.ac_journal_entries set status='posted',approved_by=p_actor,approved_at=now(),posted_by=p_actor,posted_at=now(),row_version=row_version+1 where id=j.id returning * into j;
  return j;
end $$;

create or replace function public.ac_close_period(p_period_id uuid,p_actor text) returns public.ac_periods
language plpgsql security definer set search_path=public as $$
declare p public.ac_periods%rowtype; draft_count integer;
begin
  select * into p from public.ac_periods where id=p_period_id for update;
  if not found then raise exception 'PERIOD_NOT_FOUND'; end if;
  select count(*) into draft_count from public.ac_journal_entries where period_id=p.id and status in ('draft','pending_approval','rejected');
  if draft_count>0 then raise exception 'PERIOD_HAS_UNFINISHED_JOURNALS count=%',draft_count; end if;
  update public.ac_periods set status='closed',closed_by=p_actor,closed_at=now() where id=p.id returning * into p;
  return p;
end $$;

create or replace function public.ac_prevent_audit_change() returns trigger language plpgsql as $$
begin raise exception 'ACCOUNTING_AUDIT_LOG_IS_APPEND_ONLY'; end $$;

drop trigger if exists trg_ac_journal_line_guard on public.ac_journal_lines;
create trigger trg_ac_journal_line_guard before insert or update or delete on public.ac_journal_lines for each row execute function public.ac_guard_journal_line_change();
drop trigger if exists trg_ac_audit_immutable on public.ac_audit_log;
create trigger trg_ac_audit_immutable before update or delete on public.ac_audit_log for each row execute function public.ac_prevent_audit_change();

do $$ declare table_name text; begin
  foreach table_name in array array['ac_companies','ac_periods','ac_accounts','ac_partners','ac_documents','ac_journal_entries','ac_journal_lines','ac_approvals','ac_open_items','ac_settlements','ac_tax_rules','ac_tax_transactions','ac_tax_filings','ac_bank_accounts','ac_bank_statement_lines','ac_bank_matches','ac_inventory_items','ac_inventory_movements','ac_production_cost_batches','ac_fixed_assets','ac_depreciation_runs','ac_audit_log'] loop
    execute format('alter table public.%I enable row level security',table_name);
    execute format('revoke all on public.%I from anon, authenticated',table_name);
    execute format('grant select,insert,update,delete on public.%I to service_role',table_name);
  end loop;
end $$;
grant usage,select on all sequences in schema public to service_role;
grant execute on function public.ac_assert_balanced(uuid) to service_role;
grant execute on function public.ac_post_journal(uuid,text) to service_role;
grant execute on function public.ac_close_period(uuid,text) to service_role;

insert into public.ac_tax_rules(tax_type,code,label_th,rate,effective_from,effective_to,conditions,official_source_url,verified_at,verified_by)
values
('vat','VAT7','ภาษีมูลค่าเพิ่ม 7%',0.07,'2024-10-01','2026-09-30','{"registration_threshold":1800000}'::jsonb,'https://www.rd.go.th/region/08/chiangrai/265/3664.html',now(),'ARC migration 2026-07-18'),
('wht','SERVICE3','ค่าบริการ/รับจ้างทำของ 3%',0.03,'2002-07-16',null,'{}'::jsonb,'https://www.rd.go.th/3535.html',now(),'ARC migration 2026-07-18'),
('wht','RENT5','ค่าเช่า 5%',0.05,'2002-07-16',null,'{}'::jsonb,'https://www.rd.go.th/3535.html',now(),'ARC migration 2026-07-18'),
('wht','AD2','ค่าโฆษณา 2%',0.02,'2002-07-16',null,'{}'::jsonb,'https://www.rd.go.th/3535.html',now(),'ARC migration 2026-07-18'),
('cit','CIT20','ภาษีเงินได้นิติบุคคลทั่วไป 20%',0.20,'2016-01-01',null,'{}'::jsonb,'https://www.rd.go.th/841.html',now(),'ARC migration 2026-07-18')
on conflict(tax_type,code,effective_from) do update set rate=excluded.rate,effective_to=excluded.effective_to,conditions=excluded.conditions,official_source_url=excluded.official_source_url,verified_at=excluded.verified_at,verified_by=excluded.verified_by;

insert into public.ac_companies(company_key,legal_name,vat_registered)
values('pismai-main','พิศมัยผลไม้แช่แข็ง',true)
on conflict(company_key) do nothing;

insert into public.ac_accounts(company_id,code,name_th,account_type,normal_side,is_contra,control_type,system_account)
select c.id,v.code,v.name_th,v.account_type,v.normal_side,v.is_contra,v.control_type,true
from public.ac_companies c
cross join (values
('1010','เงินสด','asset','debit',false,'cash'),('1020','เงินฝากธนาคาร','asset','debit',false,'bank'),
('1100','ลูกหนี้การค้า','asset','debit',false,'ar'),('1150','ภาษีซื้อ','asset','debit',false,'input_vat'),
('1200','สินค้าคงเหลือ','asset','debit',false,'inventory'),('1300','งานระหว่างทำ','asset','debit',false,'inventory'),
('1500','ที่ดิน อาคารและอุปกรณ์','asset','debit',false,'fixed_asset'),('1590','ค่าเสื่อมราคาสะสม','asset','credit',true,null),
('2010','เจ้าหนี้การค้า','liability','credit',false,'ap'),('2050','ภาษีขาย','liability','credit',false,'output_vat'),
('2060','ภาษีหัก ณ ที่จ่ายค้างจ่าย','liability','credit',false,'wht'),('2100','ค่าใช้จ่ายค้างจ่าย','liability','credit',false,null),
('3010','ทุนจดทะเบียน','equity','credit',false,null),('3100','กำไรสะสม','equity','credit',false,'retained_earnings'),
('4010','รายได้จากการขาย','revenue','credit',false,null),('4020','รายได้จากบริการ','revenue','credit',false,null),
('5010','ต้นทุนขาย','expense','debit',false,null),('5020','ค่าแรงทางตรง','expense','debit',false,null),
('5030','ค่าใช้จ่ายการผลิต','expense','debit',false,null),('6010','เงินเดือนและค่าแรง','expense','debit',false,null),
('6020','ค่าเช่า','expense','debit',false,null),('6030','ค่าสาธารณูปโภค','expense','debit',false,null),
('6040','ค่าขนส่ง','expense','debit',false,null),('6050','ค่าโฆษณา','expense','debit',false,null),
('6090','ค่าใช้จ่ายอื่น','expense','debit',false,null),('6900','ภาษีเงินได้นิติบุคคล','expense','debit',false,null)
) as v(code,name_th,account_type,normal_side,is_contra,control_type)
where c.company_key='pismai-main'
on conflict(company_id,code) do nothing;

insert into public.ac_periods(company_id,period_code,start_date,end_date)
select c.id,to_char(d,'YYYY-MM'),d::date,(d+interval '1 month - 1 day')::date
from public.ac_companies c
cross join generate_series(date_trunc('year',current_date),date_trunc('year',current_date)+interval '23 months',interval '1 month') d
where c.company_key='pismai-main'
on conflict(company_id,period_code) do nothing;

commit;
