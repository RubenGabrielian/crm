-- Marks every order of karlen.sargsian.98@gmail.com's business as delivered
-- ("completed" = Առաքված). Only this business is touched. Safe to run more than once.
update public.orders o
set status = 'completed'
from public.tenants t
join auth.users u on u.id = t.owner_id
where o.tenant_id = t.id
  and lower(u.email) = 'karlen.sargsian.98@gmail.com'
  and o.status <> 'completed';
