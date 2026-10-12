import "server-only";

import { supabase } from "@/lib/supabase";

export type InventoryRow = {
  productId: string;
  title: string;
  imageUrl: string | null;
  /** Everything ever put into stock: available + sold + gifted. */
  received: number;
  sold: number;
  gifted: number;
  used: number;
  available: number;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function listInventory(
  tenantId: string,
): Promise<{ rows: InventoryRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from("products")
    .select("id, title, image_url, inventory(stock_quantity, gift_quantity), orders(qty)")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) return { rows: [], error: error.message };

  const rows: InventoryRow[] = [];
  for (const product of data) {
    const inventory = one(product.inventory);
    if (!inventory) continue; // stock is not tracked for this product

    // Stock is taken at the moment an order is placed, so every order counts.
    const sold = (product.orders ?? []).reduce((sum, order) => sum + order.qty, 0);
    const gifted = inventory.gift_quantity;
    const available = inventory.stock_quantity;
    rows.push({
      productId: product.id,
      title: product.title,
      imageUrl: product.image_url,
      received: available + sold + gifted,
      sold,
      gifted,
      used: sold + gifted,
      available,
    });
  }

  return { rows, error: null };
}
