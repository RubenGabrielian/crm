import "server-only";

import type { OrderStatus } from "@/config/orders";
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
};

export type OrderSource = { id: string; name: string };

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function listOrders(
  tenantId: string,
  filter: { customerId?: string; page?: number; pageSize?: number } = {},
): Promise<{ orders: Order[]; total: number; error: string | null }> {
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
