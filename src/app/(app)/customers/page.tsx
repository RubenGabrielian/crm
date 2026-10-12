import Link from "next/link";
import { TriangleAlert, Users } from "lucide-react";
import { EmptyState } from "@/components/layout/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listCustomers } from "@/lib/customers/queries";
import { formatDateTime, formatMoney, formatNumber } from "@/lib/format";
import { getCurrentTenant } from "@/lib/tenant/get-current-tenant";

// Reads live data for the current tenant on every request.
export const instant = false;

export default async function CustomersPage() {
  const tenant = await getCurrentTenant();
  const isShop = tenant.businessType === "ecommerce";
  const { customers, error } = await listCustomers(tenant.id);

  if (error) {
    console.error("listCustomers failed:", error);
    return (
      <EmptyState
        icon={TriangleAlert}
        title="Չհաջողվեց բեռնել տվյալները"
        description="Ստուգեք կապը տվյալների բազայի հետ և թարմացրեք էջը։"
      />
    );
  }

  if (customers.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Դեռ հաճախորդներ չկան"
        description={
          isShop
            ? "Յուրաքանչյուր պատվերի հաճախորդն ինքնաբերաբար կավելանա այստեղ։"
            : "Յուրաքանչյուր գրանցման հաճախորդն ինքնաբերաբար կավելանա այստեղ։"
        }
      />
    );
  }

  const numeric = "px-4 text-right tabular-nums";

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted-foreground">Ընդամենը՝ {customers.length}</p>
      <div className="overflow-hidden rounded-3xl bg-card p-3 shadow-soft">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4">Հաճախորդ</TableHead>
              <TableHead className="px-4">Կապ</TableHead>
              {isShop && <TableHead className="px-4">Հասցե</TableHead>}
              <TableHead className={numeric}>{isShop ? "Պատվերներ" : "Գրանցումներ"}</TableHead>
              <TableHead className={numeric}>Ընդհանուր գումար</TableHead>
              <TableHead className="px-4">{isShop ? "Վերջին պատվեր" : "Վերջին գրանցում"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="px-4 font-medium">
                  <Link
                    href={`/customers/${customer.id}`}
                    className="underline-offset-2 outline-none hover:underline focus-visible:underline"
                  >
                    {customer.name}
                  </Link>
                </TableCell>
                <TableCell className="px-4">
                  {customer.phone ? (
                    <a href={`tel:${customer.phone}`} className="block tabular-nums hover:underline">
                      {customer.phone}
                    </a>
                  ) : (
                    "—"
                  )}
                  {customer.email && (
                    <a
                      href={`mailto:${customer.email}`}
                      className="block text-xs text-muted-foreground hover:underline"
                    >
                      {customer.email}
                    </a>
                  )}
                </TableCell>
                {isShop && (
                  <TableCell className="max-w-56 px-4 whitespace-normal text-muted-foreground">
                    {customer.lastAddress ?? "—"}
                  </TableCell>
                )}
                <TableCell className={numeric}>{formatNumber(customer.orderCount)}</TableCell>
                <TableCell className={`${numeric} font-semibold`}>
                  {formatMoney(customer.totalSpent)}
                </TableCell>
                <TableCell className="px-4 tabular-nums text-muted-foreground">
                  {customer.lastOrderAt ? formatDateTime(customer.lastOrderAt) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
