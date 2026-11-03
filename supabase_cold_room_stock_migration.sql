-- Cold-room production ledger. Re-runnable; no sample stock and no data deletion.
begin;
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
commit;
