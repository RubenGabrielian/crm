import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CustomerCommentDialog } from "@/components/customers/customer-comment-dialog";
import { EditCustomerDialog } from "@/components/customers/edit-customer-dialog";
import { OrderStatusSelect } from "@/components/orders/order-status-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCustomer } from "@/lib/customers/queries";
import { formatDateTime, formatMoney, formatNumber } from "@/lib/format";
import { listOrders } from "@/lib/orders/queries";
import { getCurrentTenant } from "@/lib/tenant/get-current-tenant";
import { ITEM_LABELS } from "@/lib/tenant/features";

// Reads live data for the current tenant on every request.
export const instant = false;

export default async function CustomerPage({ params }: PageProps<"/customers/[id]">) {
  const { id } = await params;
  const tenant = await getCurrentTenant();
  const isShop = tenant.businessType !== "service";

  const customer = await getCustomer(tenant.id, id);
  if (!customer) notFound();

  const { orders, error } = await listOrders(tenant.id, { customerId: customer.id });
  if (error) console.error("listOrders failed:", error);

  const totalSpent = orders.reduce((sum, order) => sum + order.orderTotal, 0);
  const addresses = [...new Set(orders.map((order) => order.address).filter(Boolean))];
  const ordersLabel = isShop ? "Պատվերներ" : "Գրանցումներ";

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/customers"
        className="inline-flex items-center gap-1.5 self-start text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:underline"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Բոլոր հաճախորդները
      </Link>

      <section className="rounded-3xl bg-card p-6 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-semibold tracking-tight">{customer.name}</h2>
          <EditCustomerDialog customer={customer} />
        </div>
        <dl className="mt-4 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <Detail label="Հեռախոս">
            {customer.phone ? (
              <a href={`tel:${customer.phone}`} className="tabular-nums hover:underline">
                {customer.phone}
              </a>
            ) : (
              "—"
            )}
          </Detail>
          <Detail label="Էլ. հասցե">
            {customer.email ? (
              <a href={`mailto:${customer.email}`} className="break-all hover:underline">
                {customer.email}
              </a>
            ) : (
              "—"
            )}
          </Detail>
          <Detail label="Instagram">
            {customer.socialHandle ? (
              <a
                href={`https://instagram.com/${customer.socialHandle}`}
                target="_blank"
                rel="noreferrer"
                className="break-all hover:underline"
              >
                @{customer.socialHandle}
              </a>
            ) : (
              "—"
            )}
          </Detail>
          <Detail label="Առաջին անգամ">{formatDateTime(customer.createdAt)}</Detail>
          {isShop && (
            <Detail label={addresses.length > 1 ? "Հասցեներ" : "Հասցե"} wide>
              {addresses.length > 0 ? (
                <ul className="flex flex-col gap-0.5">
                  {addresses.map((address) => (
                    <li key={address}>{address}</li>
                  ))}
                </ul>
              ) : (
                "—"
              )}
            </Detail>
          )}
          <Detail label="Մեկնաբանություն" wide>
            <CustomerCommentDialog
              customerId={customer.id}
              customerName={customer.name}
              comment={customer.comment}
            />
          </Detail>
        </dl>
      </section>

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Stat label={ordersLabel} value={formatNumber(orders.length)} />
        <Stat label="Ընդհանուր գումար" value={formatMoney(totalSpent)} />
        <Stat
          label="Միջին գումար"
          value={formatMoney(orders.length ? totalSpent / orders.length : 0)}
        />
      </dl>

      <section className="overflow-hidden rounded-3xl bg-card p-3 shadow-soft">
        <h2 className="px-2 pt-2 pb-3 text-base font-semibold">{ordersLabel}</h2>
        {orders.length === 0 ? (
          <p className="px-2 py-6 text-sm text-muted-foreground">
            {error ? "Չհաջողվեց բեռնել տվյալները։" : "Տվյալներ չկան։"}
          </p>
        ) : (
          <div>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-5">Ամսաթիվ</TableHead>
                  <TableHead className="px-3">{ITEM_LABELS[tenant.businessType]}</TableHead>
                  <TableHead className="px-3 text-right">Քանակ</TableHead>
                  <TableHead className="px-3 text-right">Զեղչ</TableHead>
                  <TableHead className="px-3 text-right">Ընդամենը</TableHead>
                  <TableHead className="px-3">Աղբյուր</TableHead>
                  <TableHead className="px-5">Կարգավիճակ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="px-5 tabular-nums" title={order.id}>
                      <span className="block">{formatDateTime(order.createdAt)}</span>
                      <span className="block text-xs text-muted-foreground">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-48 px-3 whitespace-normal">
                      {order.productTitle}
                    </TableCell>
                    <TableCell className="px-3 text-right tabular-nums">
                      {formatNumber(order.qty)}
                    </TableCell>
                    <TableCell className="px-3 text-right tabular-nums">
                      {order.discountAmount > 0 ? (
                        `−${formatMoney(order.discountAmount)}`
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-3 text-right font-semibold tabular-nums">
                      {formatMoney(order.orderTotal)}
                    </TableCell>
                    <TableCell className="px-3 text-muted-foreground">
                      {order.source ?? "—"}
                    </TableCell>
                    <TableCell className="px-5">
                      <OrderStatusSelect
                        orderId={order.id}
                        status={order.status}
                        label={`#${order.id.slice(0, 8).toUpperCase()}`}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}

function Detail({
  label,
  wide,
  children,
}: {
  label: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={wide ? "sm:col-span-2 lg:col-span-4" : undefined}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{children}</dd>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-card p-5 shadow-soft">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{value}</dd>
    </div>
  );
}
