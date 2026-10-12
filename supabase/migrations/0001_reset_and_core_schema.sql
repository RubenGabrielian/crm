-- ⚠️ DESTRUCTIVE: deletes EVERYTHING in the public schema (tables, data,
-- views, functions, types). Auth users and storage are not touched.

begin;

drop schema if exists public cascade;
create schema public;

-- ── Tenants ──────────────────────────────────────────────────
create table public.tenants (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  business_type text not null check (business_type in ('ecommerce', 'service')),
  created_at    timestamptz not null default now()
);

-- ── Products (physical items AND services) ───────────────────
-- metadata by business type:
--   ecommerce: { "unit_cost": 2500, "delivery_cost": 1000 }
--   service:   { "teacher_name": "...", "max_students": 8, "schedule": "..." }
create table public.products (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  title      text not null check (length(trim(title)) > 0),
  price      numeric(12,2) not null check (price >= 0),
  is_active  boolean not null default true,
  metadata   jsonb not null default '{}' check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  unique (tenant_id, id)
);
create index on public.products (tenant_id, created_at desc);

-- ── Inventory (one row per stocked product) ──────────────────
create table public.inventory (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  product_id     uuid not null unique,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  updated_at     timestamptz not null default now(),
  foreign key (tenant_id, product_id)
    references public.products (tenant_id, id) on delete cascade
);
create index on public.inventory (tenant_id);

-- ── Customers ────────────────────────────────────────────────
create table public.customers (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  name          text not null,
  phone         text,
  social_handle text,                      -- Instagram URL
  created_at    timestamptz not null default now(),
  unique (tenant_id, id)
);
create index on public.customers (tenant_id, created_at desc);

-- ── Orders (orders AND enrollments) ──────────────────────────
-- metadata: { "delivery_address": "..." } or { "class_time": "..." }
create table public.orders (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid not null,
  product_id  uuid not null,
  quantity    integer not null default 1 check (quantity > 0),
  total_price numeric(12,2) not null check (total_price >= 0),
  status      text not null default 'new'
                check (status in ('new', 'confirmed', 'completed')),
  source      text not null default 'instagram_dm'
                check (source in ('instagram_dm', 'meta_ads', 'other')),
  metadata    jsonb not null default '{}' check (jsonb_typeof(metadata) = 'object'),
  created_at  timestamptz not null default now(),
  foreign key (tenant_id, customer_id) references public.customers (tenant_id, id),
  foreign key (tenant_id, product_id)  references public.products (tenant_id, id)
);
create index on public.orders (tenant_id, created_at desc);
create index on public.orders (tenant_id, customer_id);
create index on public.orders (tenant_id, product_id);

-- ── Expenses ─────────────────────────────────────────────────
create table public.expenses (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  expense_category text not null,          -- Marketing, Packaging, ...
  amount           numeric(12,2) not null check (amount >= 0),
  expense_date     date not null default current_date,
  created_at       timestamptz not null default now()
);
create index on public.expenses (tenant_id, expense_date desc);

-- ── Create a product and its stock row in one transaction ────
-- p_stock = null means "no inventory row" (services).
create function public.create_product(
  p_tenant_id uuid,
  p_title     text,
  p_price     numeric,
  p_metadata  jsonb default '{}',
  p_stock     integer default null
) returns public.products
language plpgsql security invoker set search_path = '' as $$
declare
  new_product public.products;
begin
  insert into public.products (tenant_id, title, price, metadata)
  values (p_tenant_id, p_title, p_price, coalesce(p_metadata, '{}'))
  returning * into new_product;

  if p_stock is not null then
    insert into public.inventory (tenant_id, product_id, stock_quantity)
    values (p_tenant_id, new_product.id, p_stock);
  end if;

  return new_product;
end;
$$;

-- ── Row Level Security: TEMPORARY allow-all policies ─────────
-- Anyone holding the public API key can read and write every row.
-- Replace with tenant-scoped policies before real customer data goes in.
alter table public.tenants   enable row level security;
alter table public.products  enable row level security;
alter table public.inventory enable row level security;
alter table public.customers enable row level security;
alter table public.orders    enable row level security;
alter table public.expenses  enable row level security;

create policy "temp allow all" on public.tenants   for all using (true) with check (true);
create policy "temp allow all" on public.products  for all using (true) with check (true);
create policy "temp allow all" on public.inventory for all using (true) with check (true);
create policy "temp allow all" on public.customers for all using (true) with check (true);
create policy "temp allow all" on public.orders    for all using (true) with check (true);
create policy "temp allow all" on public.expenses  for all using (true) with check (true);

-- ── Restore the grants Supabase expects on the public schema ─
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on all tables    in schema public to postgres, anon, authenticated, service_role;
grant all on all routines  in schema public to postgres, anon, authenticated, service_role;
grant all on all sequences in schema public to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on tables    to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on routines  to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to postgres, anon, authenticated, service_role;

-- ── Two demo tenants, matching the header toggle in the app ──
insert into public.tenants (id, name, business_type) values
  ('00000000-0000-4000-8000-000000000001', 'Արևիկ Խաղալիքներ', 'ecommerce'),
  ('00000000-0000-4000-8000-000000000002', 'Լինգվա Անգլերեն',  'service');

commit;

notify pgrst, 'reload schema';
