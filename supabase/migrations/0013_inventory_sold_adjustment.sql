-- Lets the admin correct a product's "sold" count on the warehouse page.
-- Shown sold = units in orders + this correction. Safe to run more than once.
alter table public.inventory
  add column if not exists sold_adjustment integer not null default 0;

notify pgrst, 'reload schema';
