-- Sale percent on checkout / manual orders, and a comment on each customer.
-- Safe to run more than once. Nothing is deleted.

begin;

-- ── 1. Customer comment ──────────────────────────────────────
alter table public.customers add column if not exists comment text;

-- ── 2. place_order accepts a sale percent ────────────────────
-- The percent is checked by the app (signed sale link or signed-in admin)
-- before it gets here; unit price and delivery fee still come from the product.
drop function if exists public.place_order(uuid, text, text, text, text, integer);

create or replace function public.place_order(
  p_product_id       uuid,
  p_name             text,
  p_email            text,
  p_phone            text,
  p_address          text,
  p_qty              integer default 1,
  p_discount_percent numeric default 0
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

  insert into public.orders
    (tenant_id, customer_id, product_id, qty, unit_price,
     discount_percent, discount_amount, delivery_fee, status, metadata)
  values (
    v_product.tenant_id, v_customer_id, v_product.id, p_qty, v_product.price,
    v_percent, round(p_qty * v_product.price * v_percent / 100, 2),
    coalesce((v_product.metadata ->> 'delivery_cost')::numeric, 0),
    'new',
    case when v_address is null then '{}'::jsonb
         else jsonb_build_object('delivery_address', v_address) end
  )
  returning id into v_order_id;

  return v_order_id;
end;
$$;

grant execute on function
  public.place_order(uuid, text, text, text, text, integer, numeric)
  to anon, authenticated;

commit;

notify pgrst, 'reload schema';
