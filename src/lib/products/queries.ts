import "server-only";

import { isOwnerPro } from "@/lib/billing/subscription";
import { requireAdminClient } from "@/lib/supabase/admin";
import { createAuthClient } from "@/lib/supabase/server";
import { itemKind, type BusinessType, type ItemKind } from "@/lib/tenant/features";
import { getCurrentAccess } from "@/lib/tenant/get-current-tenant";
import { COST_FIELDS, can } from "@/lib/tenant/permissions";

/** Product metadata without cost prices, for people not allowed to see them. */
function withoutCost(metadata: Record<string, unknown>): Record<string, unknown> {
  const visible = { ...metadata };
  for (const key of COST_FIELDS) delete visible[key];
  return visible;
}

export type Product = {
  id: string;
  title: string;
  price: number;
  isActive: boolean;
  imageUrl: string | null;
  metadata: Record<string, unknown>;
  stock: number | null;
  /** Materials one unit uses, taken from the warehouse on every sale. */
  materials: { materialId: string; quantity: number }[];
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
  /** False when the seller has no Pro: the checkout then takes no orders. */
  sellerIsPro: boolean;
  businessType: BusinessType;
  /** Goods are delivered (address needed); services are not. */
  kind: ItemKind;
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
  const supabase = await createAuthClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, title, price, is_active, image_url, metadata, inventory(stock_quantity), product_materials(material_id, quantity)",
    )
    .eq("tenant_id", tenantId)
    // Deleted products that have orders are kept as inactive rows.
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) return { products: [], error: error.message };

  // Cost prices never leave the server for employees who may not see them.
  const showCost = can(await getCurrentAccess(), "cost_view");
  const products = data.map((row) => ({
    id: row.id,
    title: row.title,
    price: Number(row.price),
    isActive: row.is_active,
    imageUrl: row.image_url,
    metadata: showCost
      ? ((row.metadata ?? {}) as Record<string, unknown>)
      : withoutCost((row.metadata ?? {}) as Record<string, unknown>),
    stock: one(row.inventory)?.stock_quantity ?? null,
    materials: (row.product_materials ?? []).map((item) => ({
      materialId: item.material_id,
      quantity: Number(item.quantity),
    })),
  }));

  return { products, error: null };
}

/** Product as shown on the public checkout page. Null if missing or inactive. */
export async function getCheckoutProduct(
  id: string,
): Promise<CheckoutProduct | null> {
  const supabase = requireAdminClient();
  if (!UUID.test(id)) return null;

  const { data, error } = await supabase
    .from("products")
    .select(
      "id, title, price, image_url, metadata, tenants(name, business_type, owner_id), inventory(stock_quantity)",
    )
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  const tenant = one(data?.tenants);
  if (!data || !tenant) return null;

  const deliveryFee = Number(
    (data.metadata as Record<string, unknown>)?.delivery_cost,
  );
  const businessType = tenant.business_type as BusinessType;
  const stock = one(data.inventory)?.stock_quantity ?? null;

  return {
    id: data.id,
    title: data.title,
    price: Number(data.price),
    imageUrl: data.image_url,
    stock,
    deliveryFee:
      Number.isFinite(deliveryFee) && deliveryFee > 0 ? deliveryFee : 0,
    tenantName: tenant.name,
    sellerIsPro: await isOwnerPro(tenant.owner_id),
    businessType,
    kind: itemKind(businessType, stock),
  };
}
