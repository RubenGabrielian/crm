-- Expenses: free-text note per expense. Safe to run more than once.
alter table public.expenses add column if not exists description text;
notify pgrst, 'reload schema';
