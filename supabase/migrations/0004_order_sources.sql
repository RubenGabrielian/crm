-- Order sources: an admin-managed list per tenant ("Instagram DM", "Meta Ads", ...)
-- and a free-text source on each order. Safe to run more than once.

begin;

-- ── 1. The list of options ───────────────────────────────────
create table if not exists public.order_sources (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  name       text not null check (length(trim(name)) > 0),
  created_at timestamptz not null default now()
);
create unique index if not exists order_sources_tenant_name_key
  on public.order_sources (tenant_id, lower(name));

alter table public.order_sources enable row level security;
drop policy if exists "temp allow all" on public.order_sources;
create policy "temp allow all" on public.order_sources
  for all using (true) with check (true);
grant all on public.order_sources to postgres, anon, authenticated, service_role;

insert into public.order_sources (tenant_id, name)
select t.id, s.name
from public.tenants t
cross join (values ('Instagram DM'), ('Meta Ads')) as s(name)
on conflict do nothing;

-- ── 2. orders.source becomes optional free text ──────────────
-- The order keeps the source name itself, so deleting an option later
-- does not change old orders.
alter table public.orders drop constraint if exists orders_source_check;
alter table public.orders alter column source drop default;
alter table public.orders alter column source drop not null;

update public.orders set source = case source
  when 'instagram_dm'  then 'Instagram DM'
  when 'meta_ads'      then 'Meta Ads'
  when 'checkout_link' then null
  when 'other'         then null
  else source
end;

-- ── 3. Checkout orders arrive without a source; the admin sets it ──
create or replace function public.place_order(
  p_product_id uuid,
  p_name       text,
  p_email      text,
  p_phone      text,
  p_address    text,
  p_qty        integer default 1
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_product     public.products;
  v_customer_id uuid;
  v_order_id    uuid;
  v_name        text := nullif(trim(p_name), '');
  v_phone       text := nullif(trim(p_phone), '');
  v_email       text := nullif(trim(p_email), '');
  v_address     text := nullif(trim(p_address), '');
begin
  if v_name is null or v_phone is null then
    raise exception 'missing_fields';
  end if;
  if p_qty is null or p_qty < 1 then
    raise exception 'invalid_qty';
  end if;

  select * into v_product
  from public.products
  where id = p_product_id and is_active;
  if not found then
    raise exception 'product_not_found';
  end if;

  -- Products with an inventory row must have enough stock; services have none.
  update public.inventory
  set stock_quantity = stock_quantity - p_qty, updated_at = now()
  where product_id = v_product.id and stock_quantity >= p_qty;
  if not found and exists (
    select 1 from public.inventory where product_id = v_product.id
  ) then
    raise exception 'out_of_stock';
  end if;

  insert into public.customers (tenant_id, name, email, phone)
  values (v_product.tenant_id, v_name, v_email, v_phone)
  on conflict (tenant_id, phone) do update
    set name  = excluded.name,
        email = coalesce(excluded.email, public.customers.email)
  returning id into v_customer_id;

  -- Unit price and delivery fee come from the product, never from the browser.
  insert into public.orders
    (tenant_id, customer_id, product_id, qty, unit_price, delivery_fee, status, metadata)
  values (
    v_product.tenant_id, v_customer_id, v_product.id, p_qty, v_product.price,
    coalesce((v_product.metadata ->> 'delivery_cost')::numeric, 0),
    'new',
    case when v_address is null then '{}'::jsonb
         else jsonb_build_object('delivery_address', v_address) end
  )
  returning id into v_order_id;

  return v_order_id;
end;
$$;

commit;

notify pgrst, 'reload schema';
