-- Reinvestments: money put back into the business. Safe to run more than once.
begin;

create table if not exists public.reinvestments (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  -- Optional: the product the money was invested in.
  product_id  uuid,
  purpose     text not null check (length(trim(purpose)) > 0),
  amount      numeric(12,2) not null check (amount > 0),
  status      text not null default 'planned'
                check (status in ('planned', 'in_progress', 'done')),
  invest_date date not null default current_date,
  created_at  timestamptz not null default now(),
  foreign key (tenant_id, product_id) references public.products (tenant_id, id)
);
create index if not exists reinvestments_tenant_date_idx
  on public.reinvestments (tenant_id, invest_date desc);

alter table public.reinvestments enable row level security;
drop policy if exists "temp allow all" on public.reinvestments;
create policy "temp allow all" on public.reinvestments
  for all using (true) with check (true);
grant all on public.reinvestments to postgres, anon, authenticated, service_role;

commit;

notify pgrst, 'reload schema';
