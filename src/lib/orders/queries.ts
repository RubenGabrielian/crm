import "server-only";

import type { OrderSearchField, OrderStatus } from "@/config/orders";
import { toPaymentMethod, type PaymentMethod } from "@/config/payments";
import { supabase } from "@/lib/supabase";

export type Order = {
  id: string;
  createdAt: string;
  customerId: string;
  customerName: string;
  customerPhone: string | null;
  address: string | null;
  productTitle: string;
  qty: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  productTotal: number;
  deliveryFee: number;
  orderTotal: number;
  status: OrderStatus;
  /** Where the order came from, e.g. "Instagram DM". Null = not set. */
  source: string | null;
  /** Admin's note on the order (stored as metadata.note). */
  comment: string | null;
  paymentMethod: PaymentMethod | null;
  /** Saved as metadata.paid; orders without it count as paid once delivered. */
  paid: boolean;
  /** Appointment, e.g. when a service is done (metadata.scheduled_at). */
  scheduledAt: string | null;
};

export type OrderSource = { id: string; name: string };

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

/** A value safe to put inside a quoted PostgREST `or` filter. */
function orValue(term: string): string {
  return `"%${term.replace(/["\\%_]/g, "")}%"`;
}

async function matchingIds(
  table: "customers" | "products",
  tenantId: string,
  columns: string[],
  term: string,
): Promise<string[]> {
  const conditions = columns
    .map((column) => `${column}.ilike.${orValue(term)}`)
    .join(",");
  const { data, error } = await supabase
    .from(table)
    .select("id")
    .eq("tenant_id", tenantId)
    .or(conditions);
  if (error) {
    console.error(`order search in ${table} failed:`, error);
    return [];
  }
  return data.map((row) => row.id as string);
}

/** Order ids starting with the typed short id, e.g. "#3FA2" or "3fa2c1d0". */
async function matchingOrderIds(tenantId: string, term: string) {
  const prefix = term.replace(/^#/, "").toLowerCase();
  if (!/^[0-9a-f-]+$/.test(prefix)) return [];
  const { data, error } = await supabase
    .from("orders")
    .select("id")
    .eq("tenant_id", tenantId);
  if (error) {
    console.error("order search by id failed:", error);
    return [];
  }
  return data
    .map((row) => row.id as string)
    .filter((id) => id.startsWith(prefix));
}

/**
 * PostgREST `or` conditions for a search. Related tables (customer, product)
 * are resolved to ids first so every field can be combined in one `or`.
 */
async function searchConditions(
  tenantId: string,
  by: OrderSearchField,
  term: string,
): Promise<string[]> {
  const want = (field: OrderSearchField) => by === "all" || by === field;
  const digits = term.replace(/\D/g, "");
  const conditions: string[] = [];

  const customerColumns = [
    ...(want("customer") ? ["name"] : []),
    ...(want("email") ? ["email"] : []),
  ];
  const customerIds = new Set<string>();
  if (customerColumns.length)
    for (const id of await matchingIds("customers", tenantId, customerColumns, term))
      customerIds.add(id);
  if (want("phone") && digits)
    for (const id of await matchingIds("customers", tenantId, ["phone"], digits))
      customerIds.add(id);
  if (customerIds.size)
    conditions.push(`customer_id.in.(${[...customerIds].join(",")})`);

  if (want("product")) {
    const productIds = await matchingIds("products", tenantId, ["title"], term);
    if (productIds.length)
      conditions.push(`product_id.in.(${productIds.join(",")})`);
  }
  if (want("order")) {
    const orderIds = await matchingOrderIds(tenantId, term);
    if (orderIds.length) conditions.push(`id.in.(${orderIds.join(",")})`);
  }
  if (want("address"))
    conditions.push(`metadata->>delivery_address.ilike.${orValue(term)}`);
  if (want("comment"))
    conditions.push(`metadata->>note.ilike.${orValue(term)}`);
  if (want("source")) conditions.push(`source.ilike.${orValue(term)}`);

  return conditions;
}

export async function listOrders(
  tenantId: string,
  filter: {
    customerId?: string;
    page?: number;
    pageSize?: number;
    search?: { by: OrderSearchField; term: string };
    /** created_at range, ISO timestamps: from inclusive, to exclusive. */
    from?: string;
    to?: string;
  } = {},
): Promise<{ orders: Order[]; total: number; error: string | null }> {
  const term = filter.search?.term.trim() ?? "";
  const conditions = term
    ? await searchConditions(tenantId, filter.search!.by, term)
    : [];
  // A search that matched nothing in any field has no results.
  if (term && conditions.length === 0)
    return { orders: [], total: 0, error: null };

  let query = supabase
    .from("orders")
    .select(
      "id, created_at, customer_id, qty, unit_price, discount_percent, discount_amount, product_total, delivery_fee, order_total, status, source, metadata, customers(name, phone), products(title)",
      { count: "exact" },
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    // Same-time orders (e.g. imported by date) keep a stable order across pages.
    .order("id", { ascending: false });
  if (filter.customerId) query = query.eq("customer_id", filter.customerId);
  if (conditions.length) query = query.or(conditions.join(","));
  if (filter.from) query = query.gte("created_at", filter.from);
  if (filter.to) query = query.lt("created_at", filter.to);
  if (filter.page && filter.pageSize) {
    const from = (filter.page - 1) * filter.pageSize;
    query = query.range(from, from + filter.pageSize - 1);
  }

  const { data, error, count } = await query;
  // A page past the end is not an error, just an empty page.
  if (error?.code === "PGRST103")
    return { orders: [], total: count ?? 0, error: null };
  if (error) return { orders: [], total: 0, error: error.message };

  const orders = data.map((row) => {
    const customer = one(row.customers);
    const metadata = (row.metadata ?? {}) as Record<string, unknown>;
    return {
      id: row.id,
      createdAt: row.created_at,
      customerId: row.customer_id,
      customerName: customer?.name ?? "—",
      customerPhone: customer?.phone ?? null,
      address:
        typeof metadata.delivery_address === "string"
          ? metadata.delivery_address
          : null,
      productTitle: one(row.products)?.title ?? "—",
      qty: row.qty,
      unitPrice: Number(row.unit_price),
      discountPercent: Number(row.discount_percent),
      discountAmount: Number(row.discount_amount),
      productTotal: Number(row.product_total),
      deliveryFee: Number(row.delivery_fee),
      orderTotal: Number(row.order_total),
      status: row.status as OrderStatus,
      source: row.source,
      paymentMethod: toPaymentMethod(metadata.payment_method),
      paid:
        typeof metadata.paid === "boolean"
          ? metadata.paid
          : row.status === "completed",
      comment:
        typeof metadata.note === "string" && metadata.note.trim()
          ? metadata.note
          : null,
      scheduledAt:
        typeof metadata.scheduled_at === "string" ? metadata.scheduled_at : null,
    };
  });

  return { orders, total: count ?? orders.length, error: null };
}

/** The tenant's own list of source options, managed from the orders page. */
export async function listOrderSources(
  tenantId: string,
): Promise<OrderSource[]> {
  const { data, error } = await supabase
    .from("order_sources")
    .select("id, name")
    .eq("tenant_id", tenantId)
    .order("created_at");

  if (error) {
    console.error("listOrderSources failed:", error);
    return [];
  }
  return data;
}
