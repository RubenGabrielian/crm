import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  ClipboardList,
  List,
  ShoppingBag,
  TriangleAlert,
} from "lucide-react";
import { cn } from "cn";
import { EmptyState } from "@/components/layout/empty-state";
import {
  PAGE_SIZE,
  Pagination,
  parsePage,
} from "@/components/layout/pagination";
import { AddOrderDialog } from "@/components/orders/add-order-dialog";
import { ManageSourcesDialog } from "@/components/orders/manage-sources-dialog";
import { OrderFilterBar } from "@/components/orders/order-filters";
import { OrderSearch } from "@/components/orders/order-search";
import {
  ORDER_FILTER_KEYS,
  ORDER_STATUS_LABELS,
  isOrderSearchField,
  parseOrderFilters,
  type OrderSearchField,
  type OrderStatus,
} from "@/config/orders";
import {
  OrdersCalendar,
  type DaySummary,
} from "@/components/orders/orders-calendar";
import { OrdersTable } from "@/components/orders/orders-table";
import { formatMoney, formatNumber } from "@/lib/format";
import {
  addMonths,
  dayKey,
  formatLongDay,
  monthKey,
  parseDay,
  parseMonth,
  startOfDayUtc,
  yerevanDate,
  type Ymd,
} from "@/lib/orders/calendar";
import {
  listOrderSources,
  listOrders,
  type Order,
} from "@/lib/orders/queries";
import { listProducts } from "@/lib/products/queries";
import { requirePermission } from "@/lib/tenant/get-current-tenant";
import { ITEM_LABELS } from "@/lib/tenant/features";

// Reads live data for the current tenant on every request.
export const instant = false;

export default async function OrdersPage({
  searchParams,
}: PageProps<"/orders">) {
  const tenant = await requirePermission("orders");
  const isShop = tenant.businessType !== "service";
  const itemLabel = ITEM_LABELS[tenant.businessType];
  const query = await searchParams;
  const page = parsePage(query.page);
  const view = query.view === "calendar" ? "calendar" : "list";
  const search = typeof query.q === "string" ? query.q.trim() : "";
  const searchBy: OrderSearchField = isOrderSearchField(query.by)
    ? query.by
    : "all";
  const searchLabels: Record<OrderSearchField, string> = {
    all: "Բոլոր դաշտերը",
    customer: "Հաճախորդի անուն",
    phone: "Հեռախոս",
    email: "Էլ. փոստ",
    product: itemLabel,
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
  const searchOnly = {
    q: search || undefined,
    by: search && searchBy !== "all" ? searchBy : undefined,
  };
  const searchFilter = search ? { by: searchBy, term: search } : undefined;

  // The calendar shows one month, so the date filters only apply to the list.
  const filters = parseOrderFilters(query);
  if (view === "calendar") {
    delete filters.from;
    delete filters.to;
  }
  const filterParams = Object.fromEntries(
    ORDER_FILTER_KEYS.map((key) => [key, filters[key]]),
  ) as Record<string, string | undefined>;
  const filtering = ORDER_FILTER_KEYS.some((key) => filters[key]);
  // Kept by paging, the view tabs and the calendar's links.
  const searchParamsToKeep = { ...searchOnly, ...filterParams };

  // Calendar: one month of orders (no paging), plus the picked day.
  const today = yerevanDate(new Date());
  const selectedDay = parseDay(query.day);
  const month = parseMonth(query.month) ??
    (selectedDay ? { year: selectedDay.year, month: selectedDay.month } : today);
  const monthStart = startOfDayUtc({ ...month, day: 1 });
  const monthEnd = startOfDayUtc({ ...addMonths(month, 1), day: 1 });

  const [{ orders, total, error }, sources, { products }] = await Promise.all([
    view === "calendar"
      ? listOrders(tenant.id, {
          search: searchFilter,
          filters,
          from: monthStart.toISOString(),
          to: monthEnd.toISOString(),
        })
      : listOrders(tenant.id, {
          page,
          pageSize: PAGE_SIZE,
          search: searchFilter,
          filters,
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
  if (view === "list" && orders.length === 0 && total > 0) {
    const last = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParamsToKeep))
      if (value) last.set(key, value);
    last.set("page", String(Math.ceil(total / PAGE_SIZE)));
    redirect(`/orders?${last}`);
  }

  const viewHref = (target: "list" | "calendar") => {
    const params = new URLSearchParams();
    if (target === "calendar") params.set("view", "calendar");
    for (const [key, value] of Object.entries(searchParamsToKeep))
      if (value) params.set(key, value);
    const text = params.toString();
    return text ? `/orders?${text}` : "/orders";
  };
  const viewTab =
    "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <nav
            aria-label="Դիտման ձև"
            className="flex rounded-full bg-card p-1 shadow-soft"
          >
            {(
              [
                ["list", "Ցուցակ", List],
                ["calendar", "Օրացույց", CalendarDays],
              ] as const
            ).map(([key, label, Icon]) => (
              <Link
                key={key}
                href={viewHref(key)}
                aria-current={view === key ? "page" : undefined}
                className={cn(
                  viewTab,
                  view === key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>
          <OrderSearch
            by={searchBy}
            q={search}
            view={view}
            keep={filterParams}
            options={(Object.keys(searchLabels) as OrderSearchField[]).map(
              (value) => ({
                value,
                label: searchLabels[value],
                placeholder: searchPlaceholders[value],
              }),
            )}
          />
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <ManageSourcesDialog sources={sources} />
          <AddOrderDialog products={productOptions} sources={sourceNames} />
        </div>
      </div>

      <OrderFilterBar
        filters={filters}
        keep={{
          ...searchOnly,
          view: view === "calendar" ? "calendar" : undefined,
          month: view === "calendar" ? monthKey(month) : undefined,
          day: view === "calendar" && selectedDay ? dayKey(selectedDay) : undefined,
        }}
        statusLabels={ORDER_STATUS_LABELS[tenant.businessType]}
        sources={sourceNames}
        products={products.map(({ id, title }) => ({ id, title }))}
        allItemsLabel={
          tenant.businessType === "service"
            ? "Բոլոր դասընթացները"
            : tenant.businessType === "mixed"
              ? "Բոլոր ապրանքներն ու ծառայությունները"
              : "Բոլոր ապրանքները"
        }
        itemLabel={itemLabel}
        showDates={view === "list"}
        today={dayKey(today)}
      />

      {view === "calendar" ? (
        <CalendarView
          orders={orders}
          month={month}
          today={today}
          selected={selectedDay}
          isShop={isShop}
          itemLabel={itemLabel}
          sourceNames={sourceNames}
          statusLabels={ORDER_STATUS_LABELS[tenant.businessType]}
          keep={searchParamsToKeep}
          searchNote={search ? `«${search}» · ${searchLabels[searchBy]}` : null}
        />
      ) : (
        <>
          <p className="-mt-2 text-sm text-muted-foreground">
            {search
              ? `Գտնվեց՝ ${formatNumber(total)} · «${search}» · ${searchLabels[searchBy]}`
              : filtering
                ? `Գտնվեց՝ ${formatNumber(total)}`
                : `Ընդամենը՝ ${formatNumber(total)}`}
          </p>
          {(search || filtering) && orders.length === 0 && (
            <p className="rounded-3xl bg-card px-6 py-10 text-center text-sm text-muted-foreground shadow-soft">
              {search
                ? "Այս որոնմամբ պատվեր չգտնվեց։ Փորձեք այլ դաշտ կամ "
                : "Այս ֆիլտրերով պատվեր չգտնվեց։ Փոխեք դրանք կամ "}
              <Link
                href="/orders"
                className="font-medium text-foreground underline underline-offset-2"
              >
                {search ? "մաքրեք որոնումը" : "մաքրեք ֆիլտրերը"}
              </Link>
              ։
            </p>
          )}
          {!search &&
            !filtering &&
            orders.length === 0 &&
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
          {orders.length > 0 && (
            <OrdersTable
              orders={orders}
              isShop={isShop}
              itemLabel={itemLabel}
              sourceNames={sourceNames}
            />
          )}
          <Pagination
            basePath="/orders"
            params={searchParamsToKeep}
            page={page}
            total={total}
          />
        </>
      )}
    </div>
  );
}

function CalendarView({
  orders,
  month,
  today,
  selected,
  isShop,
  itemLabel,
  sourceNames,
  statusLabels,
  keep,
  searchNote,
}: {
  orders: Order[];
  month: { year: number; month: number };
  today: Ymd;
  selected: Ymd | null;
  isShop: boolean;
  itemLabel: string;
  sourceNames: string[];
  statusLabels: Record<OrderStatus, string>;
  keep: Record<string, string | undefined>;
  searchNote: string | null;
}) {
  // Group the month's orders by their Yerevan calendar day.
  const byDay = new Map<string, Order[]>();
  for (const order of orders) {
    const key = dayKey(yerevanDate(order.createdAt));
    byDay.set(key, [...(byDay.get(key) ?? []), order]);
  }
  const days = new Map<string, DaySummary>();
  for (const [key, list] of byDay) {
    const byStatus = { new: 0, preorder: 0, confirmed: 0, completed: 0 };
    for (const order of list) byStatus[order.status] += 1;
    days.set(key, {
      count: list.length,
      total: list.reduce((t, order) => t + order.orderTotal, 0),
      byStatus,
      // Oldest first reads like the day went.
      names: [...list].reverse().map((order) => order.customerName),
    });
  }

  // Default to today when it is in this month; a day from another month is ignored.
  const inMonth = (d: Ymd) => d.year === month.year && d.month === month.month;
  const shownDay =
    selected && inMonth(selected) ? selected : inMonth(today) ? today : null;
  const dayOrders = shownDay ? (byDay.get(dayKey(shownDay)) ?? []) : [];
  const daySummary = shownDay ? days.get(dayKey(shownDay)) : undefined;

  const hrefFor = (target: {
    month?: { year: number; month: number };
    day?: Ymd | null;
  }) => {
    const params = new URLSearchParams({ view: "calendar" });
    for (const [key, value] of Object.entries(keep))
      if (value) params.set(key, value);
    const m = target.month ?? (target.day ? target.day : month);
    params.set("month", monthKey(m));
    if (target.day) params.set("day", dayKey(target.day));
    return `/orders?${params}`;
  };

  return (
    <div className="flex flex-col gap-4">
      {searchNote && (
        <p className="-mt-2 text-sm text-muted-foreground">
          Օրացույցը ցույց է տալիս միայն որոնման արդյունքները՝ {searchNote}
        </p>
      )}
      <OrdersCalendar
        month={month}
        today={today}
        selected={shownDay}
        days={days}
        statusLabels={statusLabels}
        hrefFor={hrefFor}
        selectedCount={dayOrders.length}
      />

      {shownDay && (
        <section id="day-orders" className="flex scroll-mt-4 flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
            <h2 className="text-lg font-semibold tracking-tight">
              {formatLongDay(shownDay)}
            </h2>
            <p className="text-sm text-muted-foreground tabular-nums">
              {daySummary
                ? `${formatNumber(daySummary.count)} պատվեր · ${formatMoney(daySummary.total)}`
                : "Պատվեր չկա"}
            </p>
          </div>
          {dayOrders.length > 0 ? (
            <OrdersTable
              orders={dayOrders}
              isShop={isShop}
              itemLabel={itemLabel}
              sourceNames={sourceNames}
            />
          ) : (
            <p className="rounded-3xl bg-card px-6 py-10 text-center text-sm text-muted-foreground shadow-soft">
              Այս օրը {isShop ? "պատվերներ" : "գրանցումներ"} չեն եղել։ Ընտրեք
              այլ օր օրացույցում։
            </p>
          )}
        </section>
      )}
    </div>
  );
}
