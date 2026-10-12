-- Warehouse: track units given away as gifts, and add/write off stock safely.
-- Safe to run more than once. Nothing is deleted.

begin;

alter table public.inventory
  add column if not exists gift_quantity integer not null default 0
  check (gift_quantity >= 0);

-- Receive new stock and/or write units off as gifts, in one atomic step.
create or replace function public.adjust_stock(
  p_tenant_id  uuid,
  p_product_id uuid,
  p_received   integer default 0,
  p_gifted     integer default 0
) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if coalesce(p_received, 0) < 0 or coalesce(p_gifted, 0) < 0 then
    raise exception 'invalid_qty';
  end if;

  update public.inventory
  set stock_quantity = stock_quantity + coalesce(p_received, 0) - coalesce(p_gifted, 0),
      gift_quantity  = gift_quantity + coalesce(p_gifted, 0),
      updated_at     = now()
  where product_id = p_product_id
    and tenant_id = p_tenant_id
    and stock_quantity + coalesce(p_received, 0) - coalesce(p_gifted, 0) >= 0;

  if not found then
    if exists (
      select 1 from public.inventory
      where product_id = p_product_id and tenant_id = p_tenant_id
    ) then
      raise exception 'out_of_stock';
    end if;
    raise exception 'product_not_found';
  end if;
end;
$$;

grant execute on function public.adjust_stock(uuid, uuid, integer, integer)
  to anon, authenticated;

commit;

notify pgrst, 'reload schema';
