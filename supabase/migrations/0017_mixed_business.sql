-- Businesses that sell goods AND services (e.g. car glass plus fitting), and
-- per-order prices. Safe to run more than once. Nothing is deleted.
--
-- In a mixed business a catalog item without an inventory row is a service;
-- that already works, so products need no new column.

begin;

-- ── 1. Third business type ───────────────────────────────────
alter table public.tenants drop constraint if exists tenants_business_type_check;
alter table public.tenants add constraint tenants_business_type_check
  check (business_type in ('ecommerce', 'service', 'mixed'));

-- ── 2. update_order can change the unit price ────────────────
-- A service is often priced per job, so the admin may correct the price of
-- one order. p_unit_price = null keeps the current price.
drop function if exists public.update_order(
  uuid, uuid, text, text, integer, numeric, numeric, numeric, text
);

create or replace function public.update_order(
  p_order_id         uuid,
  p_tenant_id        uuid,
  p_phone            text,
  p_address          text,
  p_qty              integer,
  p_discount_percent numeric,
  p_discount_amount  numeric,
  p_delivery_fee     numeric,
  p_status           text,
  p_unit_price       numeric default null
) returns void
language plpgsql security invoker set search_path = '' as $$
declare
  v_order    public.orders;
  v_phone    text := nullif(trim(p_phone), '');
  v_address  text := nullif(trim(p_address), '');
  v_percent  numeric := coalesce(p_discount_percent, 0);
  v_price    numeric;
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
  if p_unit_price is not null and p_unit_price < 0 then
    raise exception 'invalid_price';
  end if;
  v_price := coalesce(p_unit_price, v_order.unit_price);

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
    perform public.consume_materials(v_order.product_id, v_delta);
  end if;

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
$$;

grant execute on function public.update_order(
  uuid, uuid, text, text, integer, numeric, numeric, numeric, text, numeric
) to anon, authenticated;

commit;

notify pgrst, 'reload schema';
