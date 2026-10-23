-- Employees: the owner adds people by email and picks what each may see and
-- do. An employee signs in with that email and works inside the owner's
-- business with only those permissions. Safe to run more than once.
begin;

create table if not exists public.tenant_members (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  -- Lowercased. One business per email.
  email       text not null unique check (email = lower(email)),
  full_name   text not null,
  -- Filled the first time the employee signs in (or when the account exists).
  user_id     uuid unique references auth.users(id) on delete set null,
  -- Pages ("dashboard", "catalog", "orders", "inventory", "customers",
  -- "expenses", "reinvestments") plus "catalog_edit" for adding/editing items
  -- and "cost_view" for seeing cost prices.
  permissions text[] not null default '{}',
  created_at  timestamptz not null default now()
);

create index if not exists tenant_members_tenant_idx on public.tenant_members (tenant_id);

alter table public.tenant_members enable row level security;

-- ── Helpers ──────────────────────────────────────────────────
-- The signed-in user's business: the one they own, else the one they work at.
create or replace function private.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select id from public.tenants where owner_id = (select auth.uid())),
    (select tenant_id from public.tenant_members where user_id = (select auth.uid()))
  )
$$;

-- Whether the signed-in user may use any of these permissions. Owners may use all.
create or replace function private.has_permission(wanted text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.tenants where owner_id = (select auth.uid()))
      or exists (
        select 1 from public.tenant_members
        where user_id = (select auth.uid()) and permissions && wanted
      )
$$;

revoke all on function private.has_permission(text[]) from public, anon;
grant execute on function private.has_permission(text[]) to authenticated;

-- ── tenant_members ───────────────────────────────────────────
-- Only the owner manages employees; an employee can read their own row.
drop policy if exists "owner manages members" on public.tenant_members;
create policy "owner manages members" on public.tenant_members
  for all to authenticated
  using (tenant_id in (select id from public.tenants where owner_id = (select auth.uid())))
  with check (tenant_id in (select id from public.tenants where owner_id = (select auth.uid())));

drop policy if exists "member reads self" on public.tenant_members;
create policy "member reads self" on public.tenant_members
  for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.tenant_members from anon;

-- ── tenants: employees can read the business they work at ────
drop policy if exists "member reads tenant" on public.tenants;
create policy "member reads tenant" on public.tenants
  for select to authenticated
  using (id = (select private.current_tenant_id()));

-- ── Money: only for people allowed to see it ─────────────────
do $$
declare
  t text;
begin
  foreach t in array array['expenses', 'recurring_expenses', 'reinvestments'] loop
    execute format('drop policy if exists "tenant owner only" on public.%I', t);
    execute format('drop policy if exists "tenant money" on public.%I', t);
    execute format(
      'create policy "tenant money" on public.%I
         for all to authenticated
         using (tenant_id = (select private.current_tenant_id())
                and (select private.has_permission(array[''dashboard'', ''expenses'', ''reinvestments''])))
         with check (tenant_id = (select private.current_tenant_id())
                and (select private.has_permission(array[''dashboard'', ''expenses'', ''reinvestments''])))',
      t);
  end loop;
end
$$;

-- ── Catalog: everyone reads, only "catalog_edit" changes it ──
drop policy if exists "tenant owner only" on public.products;
drop policy if exists "tenant reads products" on public.products;
drop policy if exists "catalog editors write products" on public.products;
create policy "tenant reads products" on public.products
  for select to authenticated
  using (tenant_id = (select private.current_tenant_id()));
create policy "catalog editors write products" on public.products
  for all to authenticated
  using (tenant_id = (select private.current_tenant_id())
         and (select private.has_permission(array['catalog_edit'])))
  with check (tenant_id = (select private.current_tenant_id())
         and (select private.has_permission(array['catalog_edit'])));

commit;

notify pgrst, 'reload schema';
