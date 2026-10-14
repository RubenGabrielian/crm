-- Fixed vs variable costs, and a price for warehouse materials so each
-- product's variable cost includes the materials it uses.
-- Safe to run more than once. Nothing is deleted.
begin;

-- Price of one unit of a material (one bag, one gram of filling, ...).
alter table public.materials
  add column if not exists unit_cost numeric(12,4) not null default 0
  check (unit_cost >= 0);

-- Every expense is either fixed (paid whatever the sales) or variable.
alter table public.expenses
  add column if not exists cost_type text not null default 'fixed'
  check (cost_type in ('fixed', 'variable'));
alter table public.recurring_expenses
  add column if not exists cost_type text not null default 'fixed'
  check (cost_type in ('fixed', 'variable'));

-- Existing materials and packaging purchases start out as variable.
update public.expenses set cost_type = 'variable'
where expense_category in ('materials', 'packaging') and cost_type = 'fixed';
update public.recurring_expenses set cost_type = 'variable'
where expense_category in ('materials', 'packaging') and cost_type = 'fixed';

commit;

notify pgrst, 'reload schema';
