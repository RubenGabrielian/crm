import { AppShell } from "@/components/layout/app-shell";
import { NewOrdersProvider } from "@/components/layout/new-orders";
import { ProProvider } from "@/lib/billing/pro-context";
import { getCurrentSubscription, isProSubscription } from "@/lib/billing/subscription";
import { getNewOrderCount } from "@/lib/orders/new-count";
import { getCurrentTenant } from "@/lib/tenant/get-current-tenant";
import { TenantProvider } from "@/lib/tenant/tenant-context";

// The whole shell depends on the signed-in tenant, so it renders per request.
export const instant = false;

export default async function AppLayout({ children }: LayoutProps<"/">) {
  // Redirects to login or onboarding when there is no session or no business yet.
  const tenant = await getCurrentTenant();
  const [newOrders, subscription] = await Promise.all([
    getNewOrderCount(),
    getCurrentSubscription(),
  ]);

  return (
    <TenantProvider tenant={tenant}>
      <ProProvider isPro={isProSubscription(subscription)}>
        {/* Keyed by tenant so switching business type restarts the count. */}
        <NewOrdersProvider key={tenant.id} initialCount={newOrders}>
          <AppShell>{children}</AppShell>
        </NewOrdersProvider>
      </ProProvider>
    </TenantProvider>
  );
}
