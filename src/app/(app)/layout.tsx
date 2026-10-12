import { AppShell } from "@/components/layout/app-shell";
import { NewOrdersProvider } from "@/components/layout/new-orders";
import { getNewOrderCount } from "@/lib/orders/new-count";
import { getCurrentTenant } from "@/lib/tenant/get-current-tenant";
import { TenantProvider } from "@/lib/tenant/tenant-context";

// The whole shell depends on the signed-in tenant, so it renders per request.
export const instant = false;

export default async function AppLayout({ children }: LayoutProps<"/">) {
  // Redirects to login or onboarding when there is no session or no business yet.
  const tenant = await getCurrentTenant();
  const newOrders = await getNewOrderCount();

  return (
    <TenantProvider tenant={tenant}>
      {/* Keyed by tenant so switching business type restarts the count. */}
      <NewOrdersProvider key={tenant.id} initialCount={newOrders}>
        <AppShell>{children}</AppShell>
      </NewOrdersProvider>
    </TenantProvider>
  );
}
