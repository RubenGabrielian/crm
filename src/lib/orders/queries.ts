import "server-only";

import type { OrderStatus } from "@/config/orders";
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
};

export type OrderSource = { id: string; name: string };

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function listOrders(
  tenantId: string,
  filter: { customerId?: string } = {},
): Promise<{ orders: Order[]; error: string | null }> {
  let query = supabase
    .from("orders")
    .select(
      "id, created_at, customer_id, qty, unit_price, discount_percent, discount_amount, product_total, delivery_fee, order_total, status, source, metadata, customers(name, phone), products(title)",
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  if (filter.customerId) query = query.eq("customer_id", filter.customerId);

  const { data, error } = await query;
  if (error) return { orders: [], error: error.message };

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
        typeof metadata.delivery_address === "string" ? metadata.delivery_address : null,
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
    };
  });

  return { orders, error: null };
}

/** The tenant's own list of source options, managed from the orders page. */
export async function listOrderSources(tenantId: string): Promise<OrderSource[]> {
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
