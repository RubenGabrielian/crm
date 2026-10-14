import "server-only";

import { expenseGroup } from "@/config/expenses";
import { listRecurringExpenses, monthlyCharges } from "@/lib/expenses/queries";
import { supabase } from "@/lib/supabase";
import {
  dateStringOf,
  daysBetween,
  rangeBounds,
  type DateRange,
} from "./range";

/**
 * Every order counts as a sale: there is no cancelled status, cancelled
 * orders are deleted. `deliveredOrders` is shown for information only.
 * "Sales" is product revenue without delivery fees, which only pass through.
 *
 * Costs follow the variable / fixed model:
 *   variable = product cost + materials used + expenses marked variable
 *   contribution margin = sales − variable
 *   net profit = contribution margin − fixed expenses
 * Personal spending is kept apart from the business result.
 */
export type Analytics = {
  totalOrders: number;
  deliveredOrders: number;
  unitsSold: number;
  /** qty × unit price, before discounts. */
  grossSales: number;
  discounts: number;
  /** Product revenue after discounts, without delivery fees. */
  sales: number;
  /** Delivery fees charged to customers (not part of sales or profit). */
  deliveryCollected: number;
  /** Sales ÷ orders. */
  averageOrder: number;
  /** qty × the product's current unit cost. */
  cogs: number;
  /** Sales − COGS (before materials and expenses). */
  grossProfit: number;
  /** qty × the materials one unit uses × their unit cost. */
  materialsCost: number;
  /** Expenses marked variable (e.g. materials bought in bulk). */
  variableExpenses: number;
  /** COGS + materials + variable expenses. */
  variableCosts: number;
  /** Sales − variable costs. */
  contribution: number;
  /** Contribution ÷ sales, as a percentage. Null when there are no sales. */
  contributionMargin: number | null;
  /** Expenses marked fixed (marketing budget, rent, ...). */
  fixedCosts: number;
  /** Marketing categories, fixed or variable; used for CAC and ROAS. */
  marketingSpend: number;
  /** The owner's personal spending. */
  personalExpenses: number;
  /** Contribution − fixed costs. */
  netProfit: number;
  /** Net profit − personal expenses. */
  remainingAfterExpenses: number;
  breakEven: {
    /** First day in the period whose running contribution covered the fixed costs. */
    date: string | null;
    /** Contribution of one average unit sold. Null when nothing was sold. */
    contributionPerUnit: number | null;
    /** Units needed in the period to cover the fixed costs. */
    unitsNeeded: number | null;
    /** Money still missing to reach zero (0 once reached). */
    remaining: number;
    /** Contribution ÷ fixed costs, capped at 1. */
    progress: number;
  };
  /** Marketing spend ÷ total orders. Null when there are no orders. */
  cac: number | null;
  /** Sales ÷ marketing spend. Null when nothing was spent on marketing. */
  roas: number | null;
  /** Net profit ÷ sales, as a percentage. Null when there are no sales. */
  profitMargin: number | null;
  daily: { date: string; revenue: number; orders: number }[];
  products: {
    title: string;
    units: number;
    revenue: number;
    grossProfit: number;
  }[];
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
        "created_at, qty, unit_price, discount_amount, product_total, delivery_fee, order_total, status, source, products(title, metadata, product_materials(quantity, materials(unit_cost)))",
      )
      .eq("tenant_id", tenantId)
      .gte("created_at", start)
      .lt("created_at", end),
    supabase
      .from("expenses")
      .select("amount, expense_category, expense_date, cost_type")
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
    daysBetween(range.from, range.to).map((date) => [
      date,
      { date, revenue: 0, orders: 0 },
    ]),
  );
  const products = new Map<
    string,
    { title: string; units: number; revenue: number; grossProfit: number }
  >();
  const sources = new Map<
    string,
    { name: string | null; orders: number; revenue: number }
  >();
  const statuses: Record<string, number> = {};

  let deliveredOrders = 0;
  let unitsSold = 0;
  let grossSales = 0;
  let discounts = 0;
  let sales = 0;
  let deliveryCollected = 0;
  let cogs = 0;
  let materialsCost = 0;
  // Contribution per day, for the break-even date.
  const dailyContribution = new Map<string, number>();

  for (const order of orders) {
    statuses[order.status] = (statuses[order.status] ?? 0) + 1;

    const product = one(order.products);
    const unitCost = Number(
      (product?.metadata as Record<string, unknown>)?.unit_cost,
    );
    const productCost = Number.isFinite(unitCost) ? order.qty * unitCost : 0;
    const materialsPerUnit = (product?.product_materials ?? []).reduce(
      (sum, use) =>
        sum + Number(use.quantity) * Number(one(use.materials)?.unit_cost ?? 0),
      0,
    );
    const orderMaterials = order.qty * materialsPerUnit;
    const productRevenue = Number(order.product_total);

    if (order.status === "completed") deliveredOrders += 1;
    unitsSold += order.qty;
    grossSales += order.qty * Number(order.unit_price);
    discounts += Number(order.discount_amount);
    sales += productRevenue;
    deliveryCollected += Number(order.delivery_fee);
    cogs += productCost;
    materialsCost += orderMaterials;
    const orderDate = dateStringOf(order.created_at);
    dailyContribution.set(
      orderDate,
      (dailyContribution.get(orderDate) ?? 0) +
        productRevenue -
        productCost -
        orderMaterials,
    );

    const day = daily.get(dateStringOf(order.created_at));
    if (day) {
      day.revenue += productRevenue;
      day.orders += 1;
    }

    const title = product?.title ?? "—";
    const productRow = products.get(title) ?? {
      title,
      units: 0,
      revenue: 0,
      grossProfit: 0,
    };
    productRow.units += order.qty;
    productRow.revenue += productRevenue;
    productRow.grossProfit += productRevenue - productCost - orderMaterials;
    products.set(title, productRow);

    const sourceKey = order.source ?? "";
    const sourceRow = sources.get(sourceKey) ?? {
      name: order.source,
      orders: 0,
      revenue: 0,
    };
    sourceRow.orders += 1;
    sourceRow.revenue += productRevenue;
    sources.set(sourceKey, sourceRow);
  }

  // ── Expenses: one-off entries plus monthly charges that fall in the range ──
  const today = dateStringOf(new Date().toISOString());
  const expenseRows = [
    ...(expensesResult.data ?? []).map((row) => ({
      category: row.expense_category as string,
      amount: Number(row.amount),
      date: row.expense_date as string,
      costType: row.cost_type === "variable" ? "variable" : "fixed",
    })),
    ...monthlyCharges(recurring, range, today),
  ];

  const marketing = new Map<string, number>();
  let marketingSpend = 0;
  let fixedCosts = 0;
  let variableExpenses = 0;
  let personalExpenses = 0;
  for (const expense of expenseRows) {
    const group = expenseGroup(expense.category);
    if (group === "personal") {
      personalExpenses += expense.amount;
      continue;
    }
    if (group === "marketing") {
      marketingSpend += expense.amount;
      marketing.set(
        expense.category,
        (marketing.get(expense.category) ?? 0) + expense.amount,
      );
    }
    if (expense.costType === "variable") {
      variableExpenses += expense.amount;
      dailyContribution.set(
        expense.date,
        (dailyContribution.get(expense.date) ?? 0) - expense.amount,
      );
    } else {
      fixedCosts += expense.amount;
    }
  }

  // ── KPIs ───────────────────────────────────────────────────
  const grossProfit = sales - cogs;
  const variableCosts = cogs + materialsCost + variableExpenses;
  const contribution = sales - variableCosts;
  const netProfit = contribution - fixedCosts;

  // Break-even: walk the days until the running contribution covers the
  // period's fixed costs.
  let breakEvenDate: string | null = null;
  if (fixedCosts > 0) {
    let running = 0;
    for (const date of daysBetween(range.from, range.to)) {
      running += dailyContribution.get(date) ?? 0;
      if (running >= fixedCosts) {
        breakEvenDate = date;
        break;
      }
    }
  }
  const contributionPerUnit =
    unitsSold > 0 ? (sales - cogs - materialsCost) / unitsSold : null;
  const byRevenue = (a: { revenue: number }, b: { revenue: number }) =>
    b.revenue - a.revenue;

  return {
    analytics: {
      totalOrders: orders.length,
      deliveredOrders,
      unitsSold,
      grossSales,
      discounts,
      sales,
      deliveryCollected,
      averageOrder: orders.length ? sales / orders.length : 0,
      cogs,
      grossProfit,
      materialsCost,
      variableExpenses,
      variableCosts,
      contribution,
      contributionMargin: sales > 0 ? (contribution / sales) * 100 : null,
      fixedCosts,
      marketingSpend,
      personalExpenses,
      netProfit,
      remainingAfterExpenses: netProfit - personalExpenses,
      breakEven: {
        date: breakEvenDate,
        contributionPerUnit,
        unitsNeeded:
          contributionPerUnit && contributionPerUnit > 0
            ? Math.ceil((fixedCosts + variableExpenses) / contributionPerUnit)
            : null,
        remaining: Math.max(fixedCosts - contribution, 0),
        progress:
          fixedCosts > 0
            ? Math.min(Math.max(contribution / fixedCosts, 0), 1)
            : 1,
      },
      cac: orders.length ? marketingSpend / orders.length : null,
      roas: marketingSpend > 0 ? sales / marketingSpend : null,
      profitMargin: sales > 0 ? (netProfit / sales) * 100 : null,
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
