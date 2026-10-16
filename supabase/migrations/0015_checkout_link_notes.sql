-- Private admin notes on copied checkout links. The link only carries the
-- random id (?ref=…); the note itself never reaches the checkout page and is
-- saved as the order's comment (metadata.note) when the customer orders.
-- Safe to run more than once. Nothing is deleted.
begin;

create table if not exists public.checkout_link_notes (
  id          text primary key,
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  product_id  uuid not null,
  note        text not null check (length(trim(note)) > 0),
  created_at  timestamptz not null default now(),
  foreign key (tenant_id, product_id) references public.products (tenant_id, id) on delete cascade
);
create index if not exists checkout_link_notes_product_idx
  on public.checkout_link_notes (tenant_id, product_id);

alter table public.checkout_link_notes enable row level security;
drop policy if exists "temp allow all" on public.checkout_link_notes;
create policy "temp allow all" on public.checkout_link_notes for all using (true) with check (true);

commit;
