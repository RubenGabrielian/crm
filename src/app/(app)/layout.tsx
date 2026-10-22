import { AppShell } from "@/components/layout/app-shell";
import { NewOrdersProvider } from "@/components/layout/new-orders";
import { ProProvider } from "@/lib/billing/pro-context";
import { getCurrentSubscription, hasProAccess } from "@/lib/billing/subscription";
import { getCommentLabel, getNavLabels } from "@/lib/navigation/labels";
import { NavLabelsProvider } from "@/lib/navigation/labels-context";
import { getNewOrderCount } from "@/lib/orders/new-count";
import { getCurrentTenant } from "@/lib/tenant/get-current-tenant";
import { TenantProvider } from "@/lib/tenant/tenant-context";

// The whole shell depends on the signed-in tenant, so it renders per request.
export const instant = false;

export default async function AppLayout({ children }: LayoutProps<"/">) {
  // Redirects to login or onboarding when there is no session or no business yet.
  const tenant = await getCurrentTenant();
  const [newOrders, subscription, navLabels, commentLabel] = await Promise.all([
    getNewOrderCount(),
    getCurrentSubscription(),
    getNavLabels(),
    getCommentLabel(),
  ]);

  return (
    <TenantProvider tenant={tenant}>
      <ProProvider isPro={hasProAccess(subscription)}>
        {/* Keyed by tenant so switching business type restarts the count. */}
        <NewOrdersProvider key={tenant.id} initialCount={newOrders}>
          <NavLabelsProvider labels={navLabels} commentLabel={commentLabel}>
            <AppShell>{children}</AppShell>
          </NavLabelsProvider>
        </NewOrdersProvider>
      </ProProvider>
    </TenantProvider>
  );
}
