import "server-only";

import { supabase } from "@/lib/supabase";
import type { BusinessType } from "@/lib/tenant/features";

export type Product = {
  id: string;
  title: string;
  price: number;
  isActive: boolean;
  imageUrl: string | null;
  metadata: Record<string, unknown>;
  stock: number | null;
};

export type CheckoutProduct = {
  id: string;
  title: string;
  price: number;
  imageUrl: string | null;
  /** null = stock is not tracked (services). */
  stock: number | null;
  /** Charged once per order; taken from the product's delivery cost field. */
  deliveryFee: number;
  tenantName: string;
  businessType: BusinessType;
};

// PostgREST returns an embedded relation as an array or a single object
// depending on how it classifies the relationship.
function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function listProducts(
  tenantId: string,
): Promise<{ products: Product[]; error: string | null }> {
  const { data, error } = await supabase
    .from("products")
    .select("id, title, price, is_active, image_url, metadata, inventory(stock_quantity)")
    .eq("tenant_id", tenantId)
    // Deleted products that have orders are kept as inactive rows.
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) return { products: [], error: error.message };

  const products = data.map((row) => ({
    id: row.id,
    title: row.title,
    price: Number(row.price),
    isActive: row.is_active,
    imageUrl: row.image_url,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    stock: one(row.inventory)?.stock_quantity ?? null,
  }));

  return { products, error: null };
}

/** Product as shown on the public checkout page. Null if missing or inactive. */
export async function getCheckoutProduct(id: string): Promise<CheckoutProduct | null> {
  if (!UUID.test(id)) return null;

  const { data, error } = await supabase
    .from("products")
    .select(
      "id, title, price, image_url, metadata, tenants(name, business_type), inventory(stock_quantity)",
    )
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  const tenant = one(data?.tenants);
  if (!data || !tenant) return null;

  const deliveryFee = Number((data.metadata as Record<string, unknown>)?.delivery_cost);

  return {
    id: data.id,
    title: data.title,
    price: Number(data.price),
    imageUrl: data.image_url,
    stock: one(data.inventory)?.stock_quantity ?? null,
    deliveryFee: Number.isFinite(deliveryFee) && deliveryFee > 0 ? deliveryFee : 0,
    tenantName: tenant.name,
    businessType: tenant.business_type as BusinessType,
  };
}
