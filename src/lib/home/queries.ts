import "server-only";

import { ORDER_STATUSES, type OrderStatus } from "@/config/orders";
import { startOfDayUtc, yerevanDate } from "@/lib/orders/calendar";
import { createAuthClient } from "@/lib/supabase/server";

export type RecentOrder = {
  id: string;
  createdAt: string;
  status: OrderStatus;
  customerName: string;
  productTitle: string;
  qty: number;
};

/** Orders at a glance, with no money in it: for employees' home page. */
export type OrdersOverview = {
  byStatus: Record<OrderStatus, number>;
  today: number;
  recent: RecentOrder[];
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

const RECENT_COUNT = 6;

export async function getOrdersOverview(
  tenantId: string,
): Promise<{ overview: OrdersOverview | null; error: unknown }> {
  const supabase = await createAuthClient();
  const count = () =>
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId);
  const todayStart = startOfDayUtc(yerevanDate(new Date())).toISOString();

  const [statusResults, todayResult, recentResult] = await Promise.all([
    Promise.all(ORDER_STATUSES.map((status) => count().eq("status", status))),
    count().gte("created_at", todayStart),
    supabase
      .from("orders")
      .select("id, created_at, status, qty, customers(name), products(title)")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(RECENT_COUNT),
  ]);

  const error =
    statusResults.find((result) => result.error)?.error ??
    todayResult.error ??
    recentResult.error;
  if (error) return { overview: null, error };

  const byStatus = Object.fromEntries(
    ORDER_STATUSES.map((status, index) => [status, statusResults[index].count ?? 0]),
  ) as Record<OrderStatus, number>;

  return {
    overview: {
      byStatus,
      today: todayResult.count ?? 0,
      recent: (recentResult.data ?? []).map((row) => ({
        id: row.id,
        createdAt: row.created_at,
        status: row.status as OrderStatus,
        customerName: one(row.customers)?.name ?? "—",
        productTitle: one(row.products)?.title ?? "—",
        qty: row.qty,
      })),
    },
    error: null,
  };
}
