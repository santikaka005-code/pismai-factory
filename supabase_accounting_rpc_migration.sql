begin;

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

grant execute on function public.ac_create_journal(text,date,text,text,text,text,jsonb,text,boolean) to service_role;
grant execute on function public.ac_approve_journal(uuid,text,text) to service_role;
grant execute on function public.ac_reject_journal(uuid,text,text,text) to service_role;

commit;
