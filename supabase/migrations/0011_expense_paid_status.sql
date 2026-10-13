-- Paid / unpaid status on expenses. Unpaid expenses are not counted in totals
-- or profit. Existing expenses stay paid. Safe to run more than once.
begin;

alter table public.expenses
  add column if not exists is_paid boolean not null default true;

commit;

notify pgrst, 'reload schema';
