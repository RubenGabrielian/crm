import Link from "next/link";
import { ClipboardList, ShoppingBag, TriangleAlert } from "lucide-react";
import { cn } from "cn";
import { EmptyState } from "@/components/layout/empty-state";
import { AddOrderDialog } from "@/components/orders/add-order-dialog";
import { DeleteOrderDialog } from "@/components/orders/delete-order-dialog";
import { EditOrderDialog } from "@/components/orders/edit-order-dialog";
import { ManageSourcesDialog } from "@/components/orders/manage-sources-dialog";
import { OrderSourceSelect } from "@/components/orders/order-source-select";
import { OrderStatusSelect } from "@/components/orders/order-status-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime, formatMoney, formatNumber } from "@/lib/format";
import { listOrderSources, listOrders } from "@/lib/orders/queries";
import { listProducts } from "@/lib/products/queries";
import { getCurrentTenant } from "@/lib/tenant/get-current-tenant";

// Reads live data for the current tenant on every request.
export const instant = false;

export default async function OrdersPage() {
  const tenant = await getCurrentTenant();
  const isShop = tenant.businessType === "ecommerce";
  const [{ orders, error }, sources, { products }] = await Promise.all([
    listOrders(tenant.id),
    listOrderSources(tenant.id),
    listProducts(tenant.id),
  ]);
  const productOptions = products.map((product) => {
    const deliveryFee = Number(product.metadata.delivery_cost);
    return {
      id: product.id,
      title: product.title,
      price: product.price,
      stock: product.stock,
      deliveryFee: Number.isFinite(deliveryFee) && deliveryFee > 0 ? deliveryFee : 0,
    };
  });
  const sourceNames = sources.map((source) => source.name);

  if (error) {
    console.error("listOrders failed:", error);
    return (
      <EmptyState
        icon={TriangleAlert}
        title="Չհաջողվեց բեռնել տվյալները"
        description="Ստուգեք կապը տվյալների բազայի հետ և թարմացրեք էջը։"
      />
    );
  }

  const numeric = "px-2 text-right tabular-nums";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">Ընդամենը՝ {orders.length}</p>
        <div className="flex flex-wrap justify-end gap-2">
          <ManageSourcesDialog sources={sources} />
          <AddOrderDialog products={productOptions} sources={sourceNames} />
        </div>
      </div>
      {orders.length === 0 &&
        (isShop ? (
          <EmptyState
            icon={ShoppingBag}
            title="Դեռ պատվերներ չկան"
            description="Ավելացրեք պատվերը ձեռքով, կամ ապրանքների էջից պատճենեք վճարման հղումը և ուղարկեք հաճախորդին։"
          />
        ) : (
          <EmptyState
            icon={ClipboardList}
            title="Դեռ գրանցումներ չկան"
            description="Ավելացրեք գրանցումը ձեռքով, կամ դասընթացների էջից պատճենեք գրանցման հղումը և ուղարկեք հաճախորդին։"
          />
        ))}
      <div
        className="overflow-hidden rounded-3xl bg-card p-3 shadow-soft"
        hidden={orders.length === 0}
      >
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-2 pl-4">Ամսաթիվ</TableHead>
              <TableHead className="px-2">Հաճախորդ</TableHead>
              <TableHead className="px-2">{isShop ? "Ապրանք" : "Դասընթաց"}</TableHead>
              <TableHead className={numeric}>Քանակ</TableHead>
              <TableHead className={numeric}>Միավորի գին</TableHead>
              <TableHead className={numeric}>Զեղչ</TableHead>
              {isShop && <TableHead className={numeric}>Առաքում</TableHead>}
              <TableHead className={numeric}>Ընդամենը</TableHead>
              <TableHead className="px-2">Կարգավիճակ</TableHead>
              <TableHead className="px-2 pr-4">
                <span className="sr-only">Գործողություններ</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="px-2 pl-4 tabular-nums" title={order.id}>
                  <span className="block">{formatDateTime(order.createdAt)}</span>
                  <span className="block text-xs text-muted-foreground">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </span>
                </TableCell>
                <TableCell className="max-w-44 px-2 whitespace-normal">
                  <Link
                    href={`/customers/${order.customerId}`}
                    className="block font-medium underline-offset-2 outline-none hover:underline focus-visible:underline"
                  >
                    {order.customerName}
                  </Link>
                  {order.customerPhone && (
                    <a
                      href={`tel:${order.customerPhone}`}
                      className="block text-xs tabular-nums text-muted-foreground hover:underline"
                    >
                      {order.customerPhone}
                    </a>
                  )}
                  {isShop && order.address && (
                    <span className="block text-xs text-muted-foreground">{order.address}</span>
                  )}
                </TableCell>
                <TableCell className="max-w-36 px-2 whitespace-normal">
                  {order.productTitle}
                </TableCell>
                <TableCell className={numeric}>{formatNumber(order.qty)}</TableCell>
                <TableCell className={numeric}>{formatMoney(order.unitPrice)}</TableCell>
                <TableCell className={numeric}>
                  {order.discountAmount > 0 ? (
                    <>
                      −{formatMoney(order.discountAmount)}
                      {order.discountPercent > 0 && (
                        <span className="block text-xs text-muted-foreground">
                          {formatNumber(order.discountPercent)}%
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                {isShop && (
                  <TableCell className={numeric}>{formatMoney(order.deliveryFee)}</TableCell>
                )}
                <TableCell className={cn(numeric, "font-semibold")}>
                  {formatMoney(order.orderTotal)}
                </TableCell>
                <TableCell className="px-2">
                  <span className="flex flex-col items-start gap-1.5 py-1">
                    <OrderStatusSelect
                      orderId={order.id}
                      status={order.status}
                      label={`#${order.id.slice(0, 8).toUpperCase()}`}
                    />
                    <OrderSourceSelect
                      orderId={order.id}
                      source={order.source}
                      options={sourceNames}
                      label={`#${order.id.slice(0, 8).toUpperCase()}`}
                    />
                  </span>
                </TableCell>
                <TableCell className="px-2 pr-4 text-right">
                  <span className="flex flex-col items-end">
                    <EditOrderDialog order={order} />
                    <DeleteOrderDialog order={order} />
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
