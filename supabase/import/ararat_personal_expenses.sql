-- Moves the "Անձնական ծախսեր" rows of karlen.sargsian.98@gmail.com's business
-- into the new "personal" category, so they are shown apart from business
-- expenses. Only this business is touched. Safe to run more than once.
update public.expenses e
set expense_category = 'personal'
from public.tenants t
join auth.users u on u.id = t.owner_id
where e.tenant_id = t.id
  and lower(u.email) = 'karlen.sargsian.98@gmail.com'
  and e.description ilike 'Անձնական ծախսեր%';
