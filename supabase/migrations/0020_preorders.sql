-- Preorders: an order the admin takes before the item is in stock. It holds no
-- stock or materials; they are taken when the order moves on to "confirmed" or
-- "completed" (and given back if it moves back to "preorder").
-- Safe to run more than once.
begin;

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('new', 'preorder', 'confirmed', 'completed'));

-- ── place_order: optional p_preorder ─────────────────────────
drop function if exists public.place_order(uuid, text, text, text, text, integer, numeric);

create or replace function public.place_order(
  p_product_id uuid,
  p_name text,
  p_email text,
  p_phone text,
  p_address text,
  p_qty integer default 1,
  p_discount_percent numeric default 0,
  p_preorder boolean default false
)
returns uuid
language plpgsql
security invoker
set search_path to ''
as $function$
declare
  v_product     public.products;
  v_customer_id uuid;
  v_order_id    uuid;
  v_name        text := nullif(trim(p_name), '');
  v_phone       text := nullif(trim(p_phone), '');
  v_email       text := nullif(trim(p_email), '');
  v_address     text := nullif(trim(p_address), '');
  v_percent     numeric := coalesce(p_discount_percent, 0);
begin
  if v_name is null or v_phone is null then
    raise exception 'missing_fields';
  end if;
  if p_qty is null or p_qty < 1 then
    raise exception 'invalid_qty';
  end if;
  if v_percent < 0 or v_percent > 100 then
    raise exception 'invalid_discount';
  end if;

  select * into v_product
  from public.products
  where id = p_product_id and is_active;
  if not found then
    raise exception 'product_not_found';
  end if;

  -- A preorder takes nothing yet. Otherwise products with an inventory row
  -- must have enough stock; services have none.
  if not coalesce(p_preorder, false) then
    update public.inventory
    set stock_quantity = stock_quantity - p_qty, updated_at = now()
    where product_id = v_product.id and stock_quantity >= p_qty;
    if not found and exists (
      select 1 from public.inventory where product_id = v_product.id
    ) then
      raise exception 'out_of_stock';
    end if;

    perform public.consume_materials(v_product.id, p_qty);
  end if;

  insert into public.customers (tenant_id, name, email, phone)
  values (v_product.tenant_id, v_name, v_email, v_phone)
  on conflict (tenant_id, phone) do update
    set name  = excluded.name,
        email = coalesce(excluded.email, public.customers.email)
  returning id into v_customer_id;

  insert into public.orders
    (tenant_id, customer_id, product_id, qty, unit_price,
     discount_percent, discount_amount, delivery_fee, status, metadata)
  values (
    v_product.tenant_id, v_customer_id, v_product.id, p_qty, v_product.price,
    v_percent, round(p_qty * v_product.price * v_percent / 100, 2),
    coalesce((v_product.metadata ->> 'delivery_cost')::numeric, 0),
    case when coalesce(p_preorder, false) then 'preorder' else 'new' end,
    case when v_address is null then '{}'::jsonb
         else jsonb_build_object('delivery_address', v_address) end
  )
  returning id into v_order_id;

  return v_order_id;
end;
$function$;

-- ── Moving stock when an order enters or leaves "preorder" ────
-- Takes p_take units of the product (negative gives them back), with materials.
create or replace function public.take_order_stock(p_product_id uuid, p_take integer)
returns void
language plpgsql
security invoker
set search_path to ''
as $function$
begin
  if coalesce(p_take, 0) = 0 then
    return;
  end if;
  update public.inventory
  set stock_quantity = stock_quantity - p_take, updated_at = now()
  where product_id = p_product_id and stock_quantity - p_take >= 0;
  if not found and exists (
    select 1 from public.inventory where product_id = p_product_id
  ) then
    raise exception 'out_of_stock';
  end if;
  perform public.consume_materials(p_product_id, p_take);
end;
$function$;

-- update_order: same signature; stock follows both the qty and the status.
create or replace function public.update_order(
  p_order_id uuid,
  p_tenant_id uuid,
  p_phone text,
  p_address text,
  p_qty integer,
  p_discount_percent numeric,
  p_discount_amount numeric,
  p_delivery_fee numeric,
  p_status text,
  p_unit_price numeric default null::numeric
)
returns void
language plpgsql
set search_path to ''
as $function$
declare
  v_order    public.orders;
  v_phone    text := nullif(trim(p_phone), '');
  v_address  text := nullif(trim(p_address), '');
  v_percent  numeric := coalesce(p_discount_percent, 0);
  v_price    numeric;
  v_discount numeric;
  v_held     integer;
  v_holds    integer;
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
  if p_unit_price is not null and p_unit_price < 0 then
    raise exception 'invalid_price';
  end if;
  v_price := coalesce(p_unit_price, v_order.unit_price);

  -- A preorder holds no stock; every other status holds its qty.
  v_held  := case when v_order.status = 'preorder' then 0 else v_order.qty end;
  v_holds := case when p_status = 'preorder' then 0 else p_qty end;
  perform public.take_order_stock(v_order.product_id, v_holds - v_held);

  if v_percent > 0 then
    v_discount := round(p_qty * v_price * v_percent / 100, 2);
  else
    v_discount := coalesce(p_discount_amount, 0);
  end if;

  update public.orders
  set qty              = p_qty,
      unit_price       = v_price,
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
$function$;

-- Status change from the orders table.
create or replace function public.set_order_status(
  p_order_id uuid,
  p_tenant_id uuid,
  p_status text
)
returns void
language plpgsql
security invoker
set search_path to ''
as $function$
declare
  v_order public.orders;
begin
  select * into v_order
  from public.orders
  where id = p_order_id and tenant_id = p_tenant_id
  for update;
  if not found then
    raise exception 'order_not_found';
  end if;

  perform public.take_order_stock(
    v_order.product_id,
    (case when p_status = 'preorder' then 0 else v_order.qty end)
      - (case when v_order.status = 'preorder' then 0 else v_order.qty end)
  );

  update public.orders set status = p_status where id = v_order.id;
end;
$function$;

revoke execute on function
  public.place_order(uuid, text, text, text, text, integer, numeric, boolean),
  public.take_order_stock(uuid, integer),
  public.set_order_status(uuid, uuid, text)
from public, anon;

grant execute on function
  public.place_order(uuid, text, text, text, text, integer, numeric, boolean),
  public.take_order_stock(uuid, integer),
  public.set_order_status(uuid, uuid, text)
to authenticated, service_role;

commit;

notify pgrst, 'reload schema';
