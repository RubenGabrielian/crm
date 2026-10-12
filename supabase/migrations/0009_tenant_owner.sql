-- Auth: each tenant belongs to one signed-in user. Safe to run more than once.
begin;

alter table public.tenants
  add column if not exists owner_id uuid references auth.users(id) on delete set null;

-- One business per user.
create unique index if not exists tenants_owner_key on public.tenants (owner_id);

commit;

notify pgrst, 'reload schema';
