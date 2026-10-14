-- Warehouse materials (packaging, labels, filling, ...) that are not sold on
-- their own, and which materials each product uses per unit sold.
-- Every sale, gift and order change moves material stock automatically.
-- Safe to run more than once. Nothing is deleted.

begin;

-- ── 1. Materials ─────────────────────────────────────────────
create table if not exists public.materials (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  name           text not null check (length(trim(name)) > 0),
  unit           text not null default 'հատ',
  -- Can go below zero: a missing bag must never block a sale.
  stock_quantity numeric(12,2) not null default 0,
  used_in_sales  numeric(12,2) not null default 0,
  used_in_gifts  numeric(12,2) not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (tenant_id, id)
);
create index if not exists materials_tenant_idx on public.materials (tenant_id, created_at);

-- ── 2. What one unit of a product uses ───────────────────────
create table if not exists public.product_materials (
  tenant_id   uuid not null,
  product_id  uuid not null,
  material_id uuid not null,
  quantity    numeric(12,3) not null check (quantity > 0),
  primary key (product_id, material_id),
  foreign key (tenant_id, product_id)
    references public.products (tenant_id, id) on delete cascade,
  foreign key (tenant_id, material_id)
    references public.materials (tenant_id, id) on delete cascade
);
create index if not exists product_materials_material_idx
  on public.product_materials (material_id);

alter table public.materials enable row level security;
alter table public.product_materials enable row level security;
drop policy if exists "temp allow all" on public.materials;
create policy "temp allow all" on public.materials for all using (true) with check (true);
drop policy if exists "temp allow all" on public.product_materials;
create policy "temp allow all" on public.product_materials for all using (true) with check (true);
grant all on public.materials, public.product_materials
  to postgres, anon, authenticated, service_role;

-- ── 3. Move material stock for N units of a product ──────────
-- p_qty > 0 uses materials, p_qty < 0 gives them back (order cancelled/reduced).
create or replace function public.consume_materials(
  p_product_id uuid,
  p_qty        numeric,
  p_gift       boolean default false
) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(p_qty, 0) = 0 then
    return;
  end if;
  update public.materials m
  set stock_quantity = m.stock_quantity - pm.quantity * p_qty,
      used_in_sales  = m.used_in_sales + case when p_gift then 0 else pm.quantity * p_qty end,
      used_in_gifts  = m.used_in_gifts + case when p_gift then pm.quantity * p_qty else 0 end,
      updated_at     = now()
  from public.product_materials pm
  where pm.product_id = p_product_id
    and m.id = pm.material_id;
end;
$$;

grant execute on function public.consume_materials(uuid, numeric, boolean)
  to anon, authenticated;

-- ── 4. Receive material stock, or correct it ─────────────────
create or replace function public.adjust_material(
  p_tenant_id   uuid,
  p_material_id uuid,
  p_received    numeric
) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  update public.materials
  set stock_quantity = stock_quantity + coalesce(p_received, 0),
      updated_at     = now()
  where id = p_material_id and tenant_id = p_tenant_id;
  if not found then
    raise exception 'material_not_found';
  end if;
end;
$$;

grant execute on function public.adjust_material(uuid, uuid, numeric)
  to anon, authenticated;

-- ── 5. Checkout / manual orders use the product's materials ──
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

  perform public.consume_materials(v_product.id, p_qty);

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

-- ── 6. Editing an order's quantity moves materials by the difference ──
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
    perform public.consume_materials(v_order.product_id, v_delta);
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

-- ── 7. Gifts use materials too (a gifted toy still goes in a bag) ──
create or replace function public.adjust_stock(
  p_tenant_id  uuid,
  p_product_id uuid,
  p_received   integer default 0,
  p_gifted     integer default 0
) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if coalesce(p_received, 0) < 0 or coalesce(p_gifted, 0) < 0 then
    raise exception 'invalid_qty';
  end if;

  update public.inventory
  set stock_quantity = stock_quantity + coalesce(p_received, 0) - coalesce(p_gifted, 0),
      gift_quantity  = gift_quantity + coalesce(p_gifted, 0),
      updated_at     = now()
  where product_id = p_product_id
    and tenant_id = p_tenant_id
    and stock_quantity + coalesce(p_received, 0) - coalesce(p_gifted, 0) >= 0;

  if not found then
    if exists (
      select 1 from public.inventory
      where product_id = p_product_id and tenant_id = p_tenant_id
    ) then
      raise exception 'out_of_stock';
    end if;
    raise exception 'product_not_found';
  end if;

  if coalesce(p_gifted, 0) > 0 then
    perform public.consume_materials(p_product_id, p_gifted, true);
  end if;
end;
$$;

commit;

notify pgrst, 'reload schema';
