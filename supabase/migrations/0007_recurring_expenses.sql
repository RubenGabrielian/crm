-- Monthly (recurring) expenses such as rent. Safe to run more than once.
begin;

create table if not exists public.recurring_expenses (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  expense_category text not null,
  description      text,
  amount           numeric(12,2) not null check (amount > 0),
  -- Charged every month on this date's day, starting from this date.
  start_date       date not null default current_date,
  -- Last day it applies; null = still running.
  end_date         date check (end_date is null or end_date >= start_date),
  created_at       timestamptz not null default now()
);
create index if not exists recurring_expenses_tenant_idx
  on public.recurring_expenses (tenant_id);

alter table public.recurring_expenses enable row level security;
drop policy if exists "temp allow all" on public.recurring_expenses;
create policy "temp allow all" on public.recurring_expenses
  for all using (true) with check (true);
grant all on public.recurring_expenses to postgres, anon, authenticated, service_role;

commit;

notify pgrst, 'reload schema';
