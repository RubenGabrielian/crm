-- Phase 3: product images, checkout support. Safe to run more than once.

begin;

-- ── 1. Product image column ──────────────────────────────────
alter table public.products add column if not exists image_url text;

-- ── 2. Public storage bucket ─────────────────────────────────
-- "public = true" is what gives everyone read access through the public URL.
-- Uploads are capped at 5 MB and limited to common image formats.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images', 'product-images', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ── 3. Upload policies ───────────────────────────────────────
drop policy if exists "product images: authenticated upload" on storage.objects;
create policy "product images: authenticated upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images');

-- TEMPORARY: the app has no sign-in yet, so its uploads arrive as "anon".
-- Without this policy the image upload in the product form would be rejected.
-- Drop it as soon as login exists.
drop policy if exists "product images: temporary anon upload" on storage.objects;
create policy "product images: temporary anon upload" on storage.objects
  for insert to anon
  with check (bucket_id = 'product-images');

-- ── 4. Customers: email + one customer per phone per tenant ──
alter table public.customers add column if not exists email text;
create unique index if not exists customers_tenant_phone_key
  on public.customers (tenant_id, phone);

-- ── 5. Orders can come from a checkout link ──────────────────
alter table public.orders drop constraint if exists orders_source_check;
alter table public.orders add constraint orders_source_check
  check (source in ('instagram_dm', 'meta_ads', 'checkout_link', 'other'));

-- ── 6. Place an order from the public checkout page ──────────
-- Everything that matters is decided here, not by the browser: the tenant,
-- the price, and whether stock is left. One transaction: reserve stock,
-- create or update the customer (matched by phone), create the order.
create or replace function public.place_order(
  p_product_id uuid,
  p_name       text,
  p_email      text,
  p_phone      text,
  p_address    text
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

  select * into v_product
  from public.products
  where id = p_product_id and is_active;
  if not found then
    raise exception 'product_not_found';
  end if;

  -- Products with an inventory row must have stock left; services have none.
  update public.inventory
  set stock_quantity = stock_quantity - 1, updated_at = now()
  where product_id = v_product.id and stock_quantity >= 1;
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
    (tenant_id, customer_id, product_id, quantity, total_price, status, source, metadata)
  values (
    v_product.tenant_id, v_customer_id, v_product.id, 1, v_product.price,
    'new', 'checkout_link',
    case when v_address is null then '{}'::jsonb
         else jsonb_build_object('delivery_address', v_address) end
  )
  returning id into v_order_id;

  return v_order_id;
end;
$$;

grant execute on function public.place_order(uuid, text, text, text, text)
  to anon, authenticated;

commit;

notify pgrst, 'reload schema';
