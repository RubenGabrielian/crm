import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardList, ShoppingBag, TriangleAlert } from "lucide-react";
import { cn } from "cn";
import { EmptyState } from "@/components/layout/empty-state";
import {
  PAGE_SIZE,
  Pagination,
  parsePage,
} from "@/components/layout/pagination";
import { AddOrderDialog } from "@/components/orders/add-order-dialog";
import { DeleteOrderDialog } from "@/components/orders/delete-order-dialog";
import { EditOrderDialog } from "@/components/orders/edit-order-dialog";
import { OrderCommentDialog } from "@/components/orders/order-comment-dialog";
import { ManageSourcesDialog } from "@/components/orders/manage-sources-dialog";
import { OrderSourceSelect } from "@/components/orders/order-source-select";
import { OrderSearch } from "@/components/orders/order-search";
import { OrderStatusSelect } from "@/components/orders/order-status-select";
import { OrderPaymentSelect } from "@/components/orders/order-payment-select";
import {
  isOrderSearchField,
  type OrderSearchField,
} from "@/config/orders";
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

export default async function OrdersPage({
  searchParams,
}: PageProps<"/orders">) {
  const tenant = await getCurrentTenant();
  const isShop = tenant.businessType === "ecommerce";
  const query = await searchParams;
  const page = parsePage(query.page);
  const search = typeof query.q === "string" ? query.q.trim() : "";
  const searchBy: OrderSearchField = isOrderSearchField(query.by)
    ? query.by
    : "all";
  const searchLabels: Record<OrderSearchField, string> = {
    all: "Բոլոր դաշտերը",
    customer: "Հաճախորդի անուն",
    phone: "Հեռախոս",
    email: "Էլ. փոստ",
    product: isShop ? "Ապրանք" : "Դասընթաց",
    order: "Պատվերի համար (#)",
    address: "Հասցե",
    comment: "Մեկնաբանություն",
    source: "Աղբյուր",
  };
  const searchPlaceholders: Record<OrderSearchField, string> = {
    all: "Անուն, հեռախոս, էլ. փոստ, ապրանք…",
    customer: "օր.՝ Անի Հակոբյան",
    phone: "օր.՝ 091 123 456",
    email: "օր.՝ name@mail.com",
    product: isShop ? "Ապրանքի անվանում" : "Դասընթացի անվանում",
    order: "օր.՝ #3FA2C1D0",
    address: "Քաղաք, փողոց",
    comment: "Մեկնաբանության տեքստ",
    source: "օր.՝ Instagram",
  };
  const searchParamsToKeep = {
    q: search || undefined,
    by: search && searchBy !== "all" ? searchBy : undefined,
  };
  const [{ orders, total, error }, sources, { products }] = await Promise.all([
    listOrders(tenant.id, {
      page,
      pageSize: PAGE_SIZE,
      search: search ? { by: searchBy, term: search } : undefined,
    }),
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
      deliveryFee:
        Number.isFinite(deliveryFee) && deliveryFee > 0 ? deliveryFee : 0,
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

  // A page number past the end (e.g. after deleting orders) goes to the last page.
  if (orders.length === 0 && total > 0) {
    const last = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParamsToKeep))
      if (value) last.set(key, value);
    last.set("page", String(Math.ceil(total / PAGE_SIZE)));
    redirect(`/orders?${last}`);
  }

  const numeric = "px-2 text-right tabular-nums";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <OrderSearch
          by={searchBy}
          q={search}
          options={(Object.keys(searchLabels) as OrderSearchField[]).map(
            (value) => ({
              value,
              label: searchLabels[value],
              placeholder: searchPlaceholders[value],
            }),
          )}
        />
        <div className="flex flex-wrap justify-end gap-2">
          <ManageSourcesDialog sources={sources} />
          <AddOrderDialog products={productOptions} sources={sourceNames} />
        </div>
      </div>
      <p className="-mt-2 text-sm text-muted-foreground">
        {search
          ? `Գտնվեց՝ ${formatNumber(total)} · «${search}» · ${searchLabels[searchBy]}`
          : `Ընդամենը՝ ${formatNumber(total)}`}
      </p>
      {search && orders.length === 0 && (
        <p className="rounded-3xl bg-card px-6 py-10 text-center text-sm text-muted-foreground shadow-soft">
          Այս որոնմամբ պատվեր չգտնվեց։ Փորձեք այլ դաշտ կամ{" "}
          <Link
            href="/orders"
            className="font-medium text-foreground underline underline-offset-2"
          >
            մաքրեք որոնումը
          </Link>
          ։
        </p>
      )}
      {!search && orders.length === 0 &&
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
              <TableHead className="px-2">
                {isShop ? "Ապրանք" : "Դասընթաց"}
              </TableHead>
              <TableHead className={numeric}>Քանակ</TableHead>
              <TableHead className={numeric}>Միավորի գին</TableHead>
              <TableHead className={numeric}>Զեղչ</TableHead>
              {isShop && <TableHead className={numeric}>Առաքում</TableHead>}
              <TableHead className={numeric}>Ընդամենը</TableHead>
              <TableHead className="px-2">Կարգավիճակ</TableHead>
              <TableHead className="px-2">Վճարում</TableHead>
              <TableHead className="px-2 pr-4">
                <span className="sr-only">Գործողություններ</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="px-2 pl-4 tabular-nums" title={order.id}>
                  <span className="block">
                    {formatDateTime(order.createdAt)}
                  </span>
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
                    <span className="block text-xs text-muted-foreground">
                      {order.address}
                    </span>
                  )}
                </TableCell>
                <TableCell className="max-w-44 px-2 whitespace-normal">
                  {order.productTitle}
                  {order.comment && (
                    <span
                      title={order.comment}
                      className="mt-1 line-clamp-2 rounded-lg bg-apricot/35 px-2 py-1 text-xs whitespace-pre-line text-foreground/80"
                    >
                      {order.comment}
                    </span>
                  )}
                </TableCell>
                <TableCell className={numeric}>
                  {formatNumber(order.qty)}
                </TableCell>
                <TableCell className={numeric}>
                  {formatMoney(order.unitPrice)}
                </TableCell>
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
                  <TableCell className={numeric}>
                    {formatMoney(order.deliveryFee)}
                  </TableCell>
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
                <TableCell className="px-2">
                  <OrderPaymentSelect
                    orderId={order.id}
                    paid={order.paid}
                    method={order.paymentMethod}
                    label={`#${order.id.slice(0, 8).toUpperCase()}`}
                  />
                </TableCell>
                <TableCell className="px-2 pr-4 text-right">
                  <span className="flex flex-col items-end">
                    <OrderCommentDialog
                      orderId={order.id}
                      label={`#${order.id.slice(0, 8).toUpperCase()}, ${order.customerName}`}
                      comment={order.comment}
                    />
                    <EditOrderDialog order={order} />
                    <DeleteOrderDialog order={order} />
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Pagination
        basePath="/orders"
        params={searchParamsToKeep}
        page={page}
        total={total}
      />
    </div>
  );
}
