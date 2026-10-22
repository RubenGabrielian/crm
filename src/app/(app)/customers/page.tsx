import Link from "next/link";
import { connection } from "next/server";
import { Search, TriangleAlert, Users } from "lucide-react";
import { cn } from "cn";
import { CustomerCommentDialog } from "@/components/customers/customer-comment-dialog";
import { CustomerProductFilter } from "@/components/customers/customer-product-filter";
import { EmptyState } from "@/components/layout/empty-state";
import {
  PAGE_SIZE,
  Pagination,
  parsePage,
} from "@/components/layout/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listCustomers, type Customer } from "@/lib/customers/queries";
import { formatDateTime, formatMoney, formatNumber } from "@/lib/format";
import { demoCustomers } from "@/lib/billing/demo-data";
import { isCurrentUserPro } from "@/lib/billing/subscription";
import { listProducts } from "@/lib/products/queries";
import { ITEM_LABELS } from "@/lib/tenant/features";
import { getCurrentTenant } from "@/lib/tenant/get-current-tenant";

// Reads live data for the current tenant on every request.
export const instant = false;

const average = (customer: Customer) =>
  customer.orderCount ? customer.totalSpent / customer.orderCount : 0;

// "recent" keeps the order from listCustomers: most recently active first.
const SORTS = {
  recent: null,
  orders: (a: Customer, b: Customer) =>
    b.orderCount - a.orderCount || b.totalSpent - a.totalSpent,
  spent: (a: Customer, b: Customer) =>
    b.totalSpent - a.totalSpent || b.orderCount - a.orderCount,
  average: (a: Customer, b: Customer) => average(b) - average(a),
} as const;
type SortKey = keyof typeof SORTS;

export default async function CustomersPage({
  searchParams,
}: PageProps<"/customers">) {
  // Sorting and search come from the URL, so this page is rendered per request.
  await connection();
  const tenant = await getCurrentTenant();
  const isShop = tenant.businessType !== "service";
  // Free accounts see the page with sample data (ProGate labels it as a demo).
  const [{ customers: allCustomers, error }, { products }] = await Promise.all([
    (await isCurrentUserPro())
      ? listCustomers(tenant.id)
      : { customers: demoCustomers(), error: null },
    listProducts(tenant.id),
  ]);

  const query = await searchParams;
  const sort: SortKey =
    typeof query.sort === "string" && query.sort in SORTS
      ? (query.sort as SortKey)
      : "recent";
  const search = typeof query.q === "string" ? query.q.trim() : "";
  // Only customers who ordered this product, when one is picked.
  const product =
    typeof query.product === "string" &&
    products.some((item) => item.id === query.product)
      ? query.product
      : "";

  const sortLabels: Record<SortKey, string> = {
    recent: "Վերջին ակտիվները",
    orders: isShop ? "Ամենաշատ պատվերներ" : "Ամենաշատ գրանցումներ",
    spent: "Ամենամեծ գումար",
    average: "Ամենամեծ միջին գումար",
  };
  const hrefFor = (key: SortKey) => {
    const params = new URLSearchParams();
    if (key !== "recent") params.set("sort", key);
    if (search) params.set("q", search);
    if (product) params.set("product", product);
    const text = params.toString();
    return text ? `/customers?${text}` : "/customers";
  };

  const needle = search.toLowerCase();
  const digits = search.replace(/\D/g, "");
  const ofProduct = product
    ? allCustomers.filter((customer) => customer.productIds.includes(product))
    : allCustomers;
  let customers = needle
    ? ofProduct.filter(
        (customer) =>
          customer.name.toLowerCase().includes(needle) ||
          customer.email?.toLowerCase().includes(needle) ||
          customer.comment?.toLowerCase().includes(needle) ||
          (digits.length > 0 && customer.phone?.includes(digits)),
      )
    : ofProduct;
  const compare = SORTS[sort];
  if (compare) customers = [...customers].sort(compare);

  const found = customers.length;
  const lastPage = Math.max(Math.ceil(found / PAGE_SIZE), 1);
  const page = Math.min(parsePage(query.page), lastPage);
  const pageCustomers = customers.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

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

  if (allCustomers.length === 0) {
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
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <nav
          aria-label="Դասավորել"
          className="flex flex-wrap rounded-3xl bg-card p-1 text-sm font-medium shadow-soft"
        >
          {(Object.keys(SORTS) as SortKey[]).map((key) => (
            <Link
              key={key}
              href={hrefFor(key)}
              aria-current={sort === key ? "true" : undefined}
              className={cn(
                "rounded-full px-3.5 py-1.5 whitespace-nowrap text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                sort === key &&
                  "bg-primary text-primary-foreground hover:text-primary-foreground",
              )}
            >
              {sortLabels[key]}
            </Link>
          ))}
        </nav>

        <form
          action="/customers"
          role="search"
          className="flex items-center gap-2"
        >
          {sort !== "recent" && (
            <input type="hidden" name="sort" value={sort} />
          )}
          {product && <input type="hidden" name="product" value={product} />}
          <label htmlFor="customer-search" className="sr-only">
            Որոնել հաճախորդ
          </label>
          <Input
            id="customer-search"
            name="q"
            type="search"
            defaultValue={search}
            placeholder="Անուն, հեռախոս, մեկնաբանություն"
            className="w-64"
          />
          <Button
            type="submit"
            variant="outline"
            size="icon"
            aria-label="Որոնել"
          >
            <Search />
          </Button>
        </form>

        {products.length > 0 && (
          <CustomerProductFilter
            value={product}
            products={products.map(({ id, title }) => ({ id, title }))}
            itemLabel={ITEM_LABELS[tenant.businessType]}
            allItemsLabel={
              tenant.businessType === "service"
                ? "Բոլոր դասընթացները"
                : tenant.businessType === "mixed"
                  ? "Բոլոր ապրանքներն ու ծառայությունները"
                  : "Բոլոր ապրանքները"
            }
            keep={{ sort: sort === "recent" ? undefined : sort, q: search || undefined }}
          />
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        {search || product
          ? `Գտնվեց՝ ${formatNumber(found)} / ${formatNumber(allCustomers.length)}`
          : `Ընդամենը՝ ${formatNumber(found)}`}
      </p>
      {customers.length === 0 ? (
        <p className="rounded-3xl bg-card px-6 py-10 text-center text-sm text-muted-foreground shadow-soft">
          {search
            ? "Այս որոնմամբ հաճախորդ չգտնվեց։ "
            : "Այս ապրանքը պատվիրած հաճախորդ չկա։ "}
          <Link
            href={sort === "recent" ? "/customers" : `/customers?sort=${sort}`}
            className="font-medium text-foreground underline underline-offset-2"
          >
            {search ? "Մաքրել որոնումը" : "Ցույց տալ բոլորին"}
          </Link>
        </p>
      ) : (
        <div className="overflow-hidden rounded-3xl bg-card p-3 shadow-soft">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4">Հաճախորդ</TableHead>
                <TableHead className="px-4">Կապ</TableHead>
                {isShop && <TableHead className="px-4">Հասցե</TableHead>}
                <TableHead className="px-4">Մեկնաբանություն</TableHead>
                <TableHead className={numeric}>
                  {isShop ? "Պատվերներ" : "Գրանցումներ"}
                </TableHead>
                <TableHead className={numeric}>Ընդհանուր գումար</TableHead>
                <TableHead className="px-4">
                  {isShop ? "Վերջին պատվեր" : "Վերջին գրանցում"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageCustomers.map((customer) => (
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
                      <a
                        href={`tel:${customer.phone}`}
                        className="block tabular-nums hover:underline"
                      >
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
                  <TableCell className="max-w-56 px-4 whitespace-normal">
                    <CustomerCommentDialog
                      customerId={customer.id}
                      customerName={customer.name}
                      comment={customer.comment}
                    />
                  </TableCell>
                  <TableCell className={numeric}>
                    {formatNumber(customer.orderCount)}
                  </TableCell>
                  <TableCell className={`${numeric} font-semibold`}>
                    {formatMoney(customer.totalSpent)}
                  </TableCell>
                  <TableCell className="px-4 tabular-nums text-muted-foreground">
                    {customer.lastOrderAt
                      ? formatDateTime(customer.lastOrderAt)
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Pagination
        basePath="/customers"
        params={{
          sort: sort === "recent" ? undefined : sort,
          q: search || undefined,
          product: product || undefined,
        }}
        page={page}
        total={found}
      />
    </div>
  );
}
