import "server-only";

import { MARKETING_CATEGORIES } from "@/config/expenses";
import { listRecurringExpenses, monthlyCharges } from "@/lib/expenses/queries";
import { supabase } from "@/lib/supabase";
import { dateStringOf, daysBetween, rangeBounds, type DateRange } from "./range";

/**
 * Money figures count only completed (delivered) orders. `totalOrders` and
 * `statuses` count every order placed in the period.
 */
export type Analytics = {
  totalOrders: number;
  deliveredOrders: number;
  unitsSold: number;
  /** qty × unit price, before discounts. */
  grossSales: number;
  discounts: number;
  /** Sum of order totals of delivered orders. */
  cashIn: number;
  /** Cash in ÷ delivered orders. */
  averageOrder: number;
  /** qty × the product's current unit cost. */
  cogs: number;
  /** Delivery fees on delivered orders: charged to customers and paid out again. */
  deliveryCosts: number;
  deliveryCount: number;
  /** Cash in − COGS − delivery costs. */
  grossProfit: number;
  marketingSpend: number;
  operatingExpenses: number;
  totalExpenses: number;
  /** Gross profit − marketing − operating expenses. */
  netProfit: number;
  /** Marketing spend ÷ total orders. Null when there are no orders. */
  cac: number | null;
  /** Cash in ÷ marketing spend. Null when nothing was spent on marketing. */
  roas: number | null;
  /** Net profit ÷ cash in, as a percentage. Null when there is no cash in. */
  profitMargin: number | null;
  daily: { date: string; revenue: number; orders: number }[];
  products: { title: string; units: number; revenue: number; grossProfit: number }[];
  sources: { name: string | null; orders: number; revenue: number }[];
  marketingByCategory: { category: string; amount: number }[];
  statuses: Record<string, number>;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function getAnalytics(
  tenantId: string,
  range: DateRange,
): Promise<{ analytics: Analytics | null; error: string | null }> {
  const { start, end } = rangeBounds(range);

  const [ordersResult, expensesResult, recurring] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "created_at, qty, unit_price, discount_amount, product_total, delivery_fee, order_total, status, source, products(title, metadata)",
      )
      .eq("tenant_id", tenantId)
      .gte("created_at", start)
      .lt("created_at", end),
    supabase
      .from("expenses")
      .select("amount, expense_category")
      .eq("tenant_id", tenantId)
      // Unpaid expenses are not money spent yet.
      .eq("is_paid", true)
      .gte("expense_date", range.from)
      .lte("expense_date", range.to),
    listRecurringExpenses(tenantId),
  ]);

  const error = ordersResult.error ?? expensesResult.error;
  if (error) return { analytics: null, error: error.message };

  // ── Orders ─────────────────────────────────────────────────
  const orders = ordersResult.data ?? [];
  const daily = new Map(
    daysBetween(range.from, range.to).map((date) => [date, { date, revenue: 0, orders: 0 }]),
  );
  const products = new Map<
    string,
    { title: string; units: number; revenue: number; grossProfit: number }
  >();
  const sources = new Map<string, { name: string | null; orders: number; revenue: number }>();
  const statuses: Record<string, number> = {};

  let deliveredOrders = 0;
  let unitsSold = 0;
  let grossSales = 0;
  let discounts = 0;
  let cashIn = 0;
  let cogs = 0;
  let deliveryCosts = 0;
  let deliveryCount = 0;

  for (const order of orders) {
    statuses[order.status] = (statuses[order.status] ?? 0) + 1;
    if (order.status !== "completed") continue;

    const product = one(order.products);
    const unitCost = Number((product?.metadata as Record<string, unknown>)?.unit_cost);
    const productCost = Number.isFinite(unitCost) ? order.qty * unitCost : 0;
    const total = Number(order.order_total);
    const productRevenue = Number(order.product_total);
    const deliveryFee = Number(order.delivery_fee);

    deliveredOrders += 1;
    unitsSold += order.qty;
    grossSales += order.qty * Number(order.unit_price);
    discounts += Number(order.discount_amount);
    cashIn += total;
    cogs += productCost;
    deliveryCosts += deliveryFee;
    if (deliveryFee > 0) deliveryCount += 1;

    const day = daily.get(dateStringOf(order.created_at));
    if (day) {
      day.revenue += total;
      day.orders += 1;
    }

    const title = product?.title ?? "—";
    const productRow = products.get(title) ?? { title, units: 0, revenue: 0, grossProfit: 0 };
    productRow.units += order.qty;
    productRow.revenue += productRevenue;
    productRow.grossProfit += productRevenue - productCost;
    products.set(title, productRow);

    const sourceKey = order.source ?? "";
    const sourceRow = sources.get(sourceKey) ?? { name: order.source, orders: 0, revenue: 0 };
    sourceRow.orders += 1;
    sourceRow.revenue += total;
    sources.set(sourceKey, sourceRow);
  }

  // ── Expenses: one-off entries plus monthly charges that fall in the range ──
  const today = dateStringOf(new Date().toISOString());
  const expenseRows = [
    ...(expensesResult.data ?? []).map((row) => ({
      category: row.expense_category as string,
      amount: Number(row.amount),
    })),
    ...monthlyCharges(recurring, range, today),
  ];

  const marketing = new Map<string, number>();
  let marketingSpend = 0;
  let operatingExpenses = 0;
  for (const expense of expenseRows) {
    if (MARKETING_CATEGORIES.includes(expense.category)) {
      marketingSpend += expense.amount;
      marketing.set(expense.category, (marketing.get(expense.category) ?? 0) + expense.amount);
    } else {
      operatingExpenses += expense.amount;
    }
  }

  // ── KPIs ───────────────────────────────────────────────────
  const grossProfit = cashIn - cogs - deliveryCosts;
  const netProfit = grossProfit - marketingSpend - operatingExpenses;
  const byRevenue = (a: { revenue: number }, b: { revenue: number }) => b.revenue - a.revenue;

  return {
    analytics: {
      totalOrders: orders.length,
      deliveredOrders,
      unitsSold,
      grossSales,
      discounts,
      cashIn,
      averageOrder: deliveredOrders ? cashIn / deliveredOrders : 0,
      cogs,
      deliveryCosts,
      deliveryCount,
      grossProfit,
      marketingSpend,
      operatingExpenses,
      totalExpenses: marketingSpend + operatingExpenses,
      netProfit,
      cac: orders.length ? marketingSpend / orders.length : null,
      roas: marketingSpend > 0 ? cashIn / marketingSpend : null,
      profitMargin: cashIn > 0 ? (netProfit / cashIn) * 100 : null,
      daily: [...daily.values()],
      products: [...products.values()].sort(byRevenue),
      sources: [...sources.values()].sort(byRevenue),
      marketingByCategory: [...marketing.entries()]
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount),
      statuses,
    },
    error: null,
  };
}
