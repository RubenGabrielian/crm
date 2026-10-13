import "server-only";

import { supabase } from "@/lib/supabase";

export type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  comment: string | null;
  /** Delivery address from the most recent order that has one. */
  lastAddress: string | null;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
};

export async function listCustomers(
  tenantId: string,
): Promise<{ customers: Customer[]; error: string | null }> {
  const { data, error } = await supabase
    .from("customers")
    .select("id, name, phone, email, comment, created_at, orders(order_total, created_at, metadata)")
    .eq("tenant_id", tenantId);

  if (error) return { customers: [], error: error.message };

  const customers = data.map((row) => {
    const orders = [...(row.orders ?? [])].sort((a, b) =>
      b.created_at.localeCompare(a.created_at),
    );
    const withAddress = orders.find(
      (order) =>
        typeof (order.metadata as Record<string, unknown>)?.delivery_address === "string",
    );
    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      comment: row.comment,
      lastAddress: withAddress
        ? ((withAddress.metadata as Record<string, unknown>).delivery_address as string)
        : null,
      orderCount: orders.length,
      totalSpent: orders.reduce((sum, order) => sum + Number(order.order_total), 0),
      lastOrderAt: orders[0]?.created_at ?? null,
      createdAt: row.created_at as string,
    };
  });

  // Most recently active first.
  customers.sort((a, b) =>
    (b.lastOrderAt ?? b.createdAt).localeCompare(a.lastOrderAt ?? a.createdAt),
  );

  return { customers, error: null };
}

export type CustomerProfile = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  socialHandle: string | null;
  comment: string | null;
  createdAt: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** One customer of the given tenant, or null if there is no such customer. */
export async function getCustomer(
  tenantId: string,
  customerId: string,
): Promise<CustomerProfile | null> {
  if (!UUID.test(customerId)) return null;

  const { data, error } = await supabase
    .from("customers")
    .select("id, name, phone, email, social_handle, comment, created_at")
    .eq("id", customerId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    phone: data.phone,
    email: data.email,
    socialHandle: data.social_handle,
    comment: data.comment,
    createdAt: data.created_at,
  };
}
