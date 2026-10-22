-- Numa Pro: one Lemon Squeezy subscription per signed-in user. The Lemon Squeezy
-- webhook writes it with the secret key; users can only read their own row.
-- Safe to run more than once.
begin;

create table if not exists public.subscriptions (
  user_id             uuid primary key references auth.users(id) on delete cascade,
  ls_subscription_id  text unique,
  ls_customer_id      text,
  ls_variant_id       text,
  -- on_trial | active | paused | past_due | unpaid | cancelled | expired
  status              text not null,
  renews_at           timestamptz,
  -- Set once cancelled: Pro stays on until this moment.
  ends_at             timestamptz,
  customer_portal_url text,
  test_mode           boolean not null default false,
  updated_at          timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists "read own subscription" on public.subscriptions;
create policy "read own subscription" on public.subscriptions
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- No insert/update/delete policies: only the secret key (which bypasses RLS)
-- can write. Revoke the grants too, so a future permissive policy can't open it.
revoke insert, update, delete on public.subscriptions from anon, authenticated;
revoke select on public.subscriptions from anon;

commit;

notify pgrst, 'reload schema';
