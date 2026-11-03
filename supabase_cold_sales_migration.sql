-- Run after supabase_cold_room_stock_migration.sql. No demo data; no stock deletion.
begin;
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
commit;
