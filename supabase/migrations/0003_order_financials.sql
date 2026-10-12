-- Phase 4: detailed order financials + admin editing. Safe to run more than once.
-- Existing orders are kept and converted; nothing is deleted.

begin;

-- ── 1. Order columns ─────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'qty'
  ) then
    -- "quantity" already existed; rename it instead of adding a duplicate.
    alter table public.orders rename column quantity to qty;

    alter table public.orders
      add column unit_price       numeric(12,2),
      add column discount_percent numeric(5,2)  not null default 0,
      add column discount_amount  numeric(12,2) not null default 0,
      add column delivery_fee     numeric(12,2) not null default 0;

    -- Convert existing orders: the old total becomes the unit price.
    update public.orders set unit_price = round(total_price / qty, 2);
    alter table public.orders alter column unit_price set not null;

    -- The totals are calculated by the database from the columns above,
    -- so they can never disagree with qty, price, discount or delivery fee.
    alter table public.orders drop column total_price;
    alter table public.orders
      add column product_total numeric(12,2)
        generated always as (qty * unit_price - discount_amount) stored,
      add column order_total numeric(12,2)
        generated always as (qty * unit_price - discount_amount + delivery_fee) stored;

    alter table public.orders add constraint orders_financials_check check (
      unit_price >= 0
      and delivery_fee >= 0
      and discount_percent between 0 and 100
      and discount_amount >= 0
      and discount_amount <= qty * unit_price
    );
  end if;
end $$;

-- ── 2. Checkout: place an order for a chosen quantity ────────
drop function if exists public.place_order(uuid, text, text, text, text);

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
    (tenant_id, customer_id, product_id, qty, unit_price, delivery_fee,
     status, source, metadata)
  values (
    v_product.tenant_id, v_customer_id, v_product.id, p_qty, v_product.price,
    coalesce((v_product.metadata ->> 'delivery_cost')::numeric, 0),
    'new', 'checkout_link',
    case when v_address is null then '{}'::jsonb
         else jsonb_build_object('delivery_address', v_address) end
  )
  returning id into v_order_id;

  return v_order_id;
end;
$$;

grant execute on function public.place_order(uuid, text, text, text, text, integer)
  to anon, authenticated;

-- ── 3. Admin: edit an order in one transaction ───────────────
-- Changing qty moves stock by the difference. A percent discount takes
-- priority: when it is above 0 the discount amount is calculated from it.
create or replace function public.update_order(
  p_order_id         uuid,
  p_tenant_id        uuid,
  p_phone            text,
  p_address          text,
  p_qty              integer,
  p_discount_percent numeric,
  p_discount_amount  numeric,
  p_delivery_fee     numeric,
  p_status           text
) returns void
language plpgsql security invoker set search_path = '' as $$
declare
  v_order    public.orders;
  v_phone    text := nullif(trim(p_phone), '');
  v_address  text := nullif(trim(p_address), '');
  v_percent  numeric := coalesce(p_discount_percent, 0);
  v_discount numeric;
  v_delta    integer;
begin
  select * into v_order
  from public.orders
  where id = p_order_id and tenant_id = p_tenant_id
  for update;
  if not found then
    raise exception 'order_not_found';
  end if;
  if v_phone is null then
    raise exception 'missing_fields';
  end if;
  if p_qty is null or p_qty < 1 then
    raise exception 'invalid_qty';
  end if;

  v_delta := p_qty - v_order.qty;
  if v_delta <> 0 then
    update public.inventory
    set stock_quantity = stock_quantity - v_delta, updated_at = now()
    where product_id = v_order.product_id and stock_quantity - v_delta >= 0;
    if not found and exists (
      select 1 from public.inventory where product_id = v_order.product_id
    ) then
      raise exception 'out_of_stock';
    end if;
  end if;

  if v_percent > 0 then
    v_discount := round(p_qty * v_order.unit_price * v_percent / 100, 2);
  else
    v_discount := coalesce(p_discount_amount, 0);
  end if;

  update public.orders
  set qty              = p_qty,
      discount_percent = v_percent,
      discount_amount  = v_discount,
      delivery_fee     = coalesce(p_delivery_fee, 0),
      status           = p_status,
      metadata         = case
        when v_address is null then metadata - 'delivery_address'
        else metadata || jsonb_build_object('delivery_address', v_address)
      end
  where id = v_order.id;

  begin
    update public.customers
    set phone = v_phone
    where id = v_order.customer_id and phone is distinct from v_phone;
  exception when unique_violation then
    raise exception 'phone_taken';
  end;
end;
$$;

grant execute on function
  public.update_order(uuid, uuid, text, text, integer, numeric, numeric, numeric, text)
  to anon, authenticated;

commit;

notify pgrst, 'reload schema';
