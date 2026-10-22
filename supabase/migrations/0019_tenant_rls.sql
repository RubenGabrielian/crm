-- Tenant isolation: replace the "temp allow all" policies with ones that only
-- let a signed-in user touch their own business's rows. The public checkout no
-- longer talks to the database as anon; it goes through the server with the
-- secret key (which bypasses RLS). Safe to run more than once.
begin;

-- ── Helper ───────────────────────────────────────────────────
-- The signed-in user's tenant (each user owns at most one). Lives outside the
-- exposed schemas so it can't be called through the API. Security definer so
-- the policies below don't recurse into the tenants policy.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.tenants where owner_id = (select auth.uid())
$$;

revoke all on function private.current_tenant_id() from public, anon;
grant execute on function private.current_tenant_id() to authenticated;

-- ── tenants ──────────────────────────────────────────────────
drop policy if exists "temp allow all" on public.tenants;
drop policy if exists "owner manages tenant" on public.tenants;
create policy "owner manages tenant" on public.tenants
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- ── Tables keyed by tenant_id ────────────────────────────────
do $$
declare
  t text;
begin
  foreach t in array array[
    'products', 'inventory', 'customers', 'orders', 'expenses',
    'order_sources', 'recurring_expenses', 'reinvestments', 'materials',
    'product_materials', 'checkout_link_notes'
  ] loop
    execute format('drop policy if exists "temp allow all" on public.%I', t);
    execute format('drop policy if exists "tenant owner only" on public.%I', t);
    execute format(
      'create policy "tenant owner only" on public.%I
         for all to authenticated
         using (tenant_id = (select private.current_tenant_id()))
         with check (tenant_id = (select private.current_tenant_id()))',
      t);
  end loop;
end
$$;

-- Nothing reaches these tables without a session any more.
revoke all on
  public.tenants, public.products, public.inventory, public.customers,
  public.orders, public.expenses, public.order_sources,
  public.recurring_expenses, public.reinvestments, public.materials,
  public.product_materials, public.checkout_link_notes
from anon;

-- ── Functions ────────────────────────────────────────────────
-- place_order and consume_materials ran as their owner, so anyone could call
-- them on any tenant's products. As invoker they obey the policies above; the
-- checkout calls place_order with the secret key.
alter function public.place_order(uuid, text, text, text, text, integer, numeric) security invoker;
alter function public.consume_materials(uuid, numeric, boolean) security invoker;

revoke execute on function
  public.place_order(uuid, text, text, text, text, integer, numeric),
  public.consume_materials(uuid, numeric, boolean),
  public.create_product(uuid, text, numeric, jsonb, integer),
  public.adjust_stock(uuid, uuid, integer, integer),
  public.adjust_material(uuid, uuid, numeric),
  public.update_order(uuid, uuid, text, text, integer, numeric, numeric, numeric, text, numeric)
from public, anon;

grant execute on function
  public.place_order(uuid, text, text, text, text, integer, numeric),
  public.consume_materials(uuid, numeric, boolean),
  public.create_product(uuid, text, numeric, jsonb, integer),
  public.adjust_stock(uuid, uuid, integer, integer),
  public.adjust_material(uuid, uuid, numeric),
  public.update_order(uuid, uuid, text, text, integer, numeric, numeric, numeric, text, numeric)
to authenticated, service_role;

-- ── Product images ───────────────────────────────────────────
-- Uploads go under "<tenant_id>/…"; only that tenant's owner may write there.
drop policy if exists "product images: temporary anon upload" on storage.objects;
drop policy if exists "product images: authenticated upload" on storage.objects;
drop policy if exists "product images: tenant upload" on storage.objects;
create policy "product images: tenant upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = (select private.current_tenant_id())::text
  );

commit;

notify pgrst, 'reload schema';
