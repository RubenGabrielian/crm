import Link from "next/link";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { cn } from "cn";
import { StockList } from "@/components/dashboard/stock-list";
import { EmptyState } from "@/components/layout/empty-state";
import { getNavigation } from "@/config/navigation";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/config/orders";
import { formatDateTime, formatNumber } from "@/lib/format";
import { getOrdersOverview } from "@/lib/home/queries";
import { listInventory } from "@/lib/inventory/queries";
import { getNavLabels } from "@/lib/navigation/labels";
import { hasFeature, usesBookings, type Tenant } from "@/lib/tenant/features";
import { can, type Access } from "@/lib/tenant/permissions";

/**
 * Home page of an employee who may not see the money: today's work instead
 * (orders by status, the latest ones, stock running low) and their pages.
 */
export async function EmployeeHome({
  tenant,
  access,
}: {
  tenant: Tenant;
  access: Access;
}) {
  const seesOrders = can(access, "orders");
  const seesStock =
    can(access, "inventory") && hasFeature(tenant.businessType, "inventory");
  const [orders, inventory, labels] = await Promise.all([
    seesOrders ? getOrdersOverview(tenant.id) : null,
    seesStock ? listInventory(tenant.id) : null,
    getNavLabels(),
  ]);
  if (orders?.error) console.error("getOrdersOverview failed:", orders.error);
  if (inventory?.error) console.error("listInventory failed:", inventory.error);

  const bookings = usesBookings(tenant.businessType);
  const statusLabels = ORDER_STATUS_LABELS[tenant.businessType];
  const pages = getNavigation(tenant.businessType, labels, access).filter(
    (item) => item.href !== "/dashboard",
  );
  const name = access.role === "employee" ? access.name.split(" ")[0] : null;
  const overview = orders?.overview;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          {name ? `Բարև, ${name}` : "Բարև"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ահա, թե ինչ է կատարվում «{tenant.name}»-ում։
        </p>
      </div>

      {seesOrders &&
        (overview ? (
          <>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
              <StatTile
                label={bookings ? "Այսօրվա գրանցումներ" : "Այսօրվա պատվերներ"}
                value={overview.today}
                href="/orders"
              />
              {ORDER_STATUSES.map((status) => (
                <StatTile
                  key={status}
                  label={statusLabels[status]}
                  value={overview.byStatus[status]}
                  href={`/orders?status=${status}`}
                  highlight={status === "new" && overview.byStatus.new > 0}
                />
              ))}
            </div>

            <Panel
              title={bookings ? "Վերջին գրանցումները" : "Վերջին պատվերները"}
              link={{ href: "/orders", label: "Բոլորը" }}
            >
              {overview.recent.length === 0 ? (
                <p className="px-2 py-6 text-sm text-muted-foreground">
                  {bookings ? "Դեռ գրանցումներ չկան։" : "Դեռ պատվերներ չկան։"}
                </p>
              ) : (
                <ul className="divide-y divide-border/70 px-2 text-sm">
                  {overview.recent.map((order) => (
                    <li
                      key={order.id}
                      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">
                          {order.customerName}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {order.productTitle}
                          {order.qty > 1 && ` × ${formatNumber(order.qty)}`}
                          {" · "}
                          <span className="tabular-nums">
                            {formatDateTime(order.createdAt)}
                          </span>
                        </span>
                      </span>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
                          order.status === "new"
                            ? "bg-apricot text-foreground"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {statusLabels[order.status]}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </>
        ) : (
          <EmptyState
            icon={TriangleAlert}
            title="Չհաջողվեց բեռնել պատվերները"
            description="Ստուգեք կապը և թարմացրեք էջը։"
          />
        ))}

      {seesStock && inventory && inventory.rows.length > 0 && (
        <Panel
          title="Պահեստ՝ ամենաքիչ մնացածները"
          link={{ href: "/inventory", label: "Պահեստ" }}
        >
          <StockList rows={inventory.rows} />
        </Panel>
      )}

      {pages.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">Ձեր բաժինները</h2>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {pages.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="group flex items-center gap-3 rounded-xl bg-card p-4 shadow-soft outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Icon className="size-4" strokeWidth={1.75} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {label}
                  </span>
                  <ArrowRight
                    className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  href,
  highlight,
}: {
  label: string;
  value: number;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col rounded-xl p-4 shadow-soft outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
        highlight ? "bg-apricot hover:bg-apricot/85" : "bg-card hover:bg-muted/60",
      )}
    >
      <span className="text-sm font-medium">{label}</span>
      <span className="mt-auto pt-2 text-2xl font-semibold tracking-tight tabular-nums">
        {formatNumber(value)}
      </span>
    </Link>
  );
}

function Panel({
  title,
  link,
  children,
}: {
  title: string;
  link: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl bg-card shadow-soft">
      <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
        <h2 className="text-base font-semibold">{title}</h2>
        <Link
          href={link.href}
          className="flex items-center gap-1 text-sm font-medium text-primary outline-none hover:underline focus-visible:underline"
        >
          {link.label}
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
      <div className="px-3 pb-3">{children}</div>
    </section>
  );
}
