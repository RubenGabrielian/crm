import "server-only";

import { createAuthClient } from "@/lib/supabase/server";

export type Material = {
  id: string;
  name: string;
  unit: string;
  imageUrl: string | null;
  /** Price of one unit, part of each product's variable cost. */
  unitCost: number;
  /** Can be negative when sales used more than was entered. */
  available: number;
  usedInSales: number;
  usedInGifts: number;
  /** Everything ever put into stock: available + used. */
  received: number;
};

export async function listMaterials(
  tenantId: string,
): Promise<{ materials: Material[]; error: string | null }> {
  const supabase = await createAuthClient();
  const { data, error } = await supabase
    .from("materials")
    .select(
      "id, name, unit, image_url, unit_cost, stock_quantity, used_in_sales, used_in_gifts",
    )
    .eq("tenant_id", tenantId)
    .order("created_at");

  if (error) return { materials: [], error: error.message };

  return {
    materials: data.map((row) => {
      const available = Number(row.stock_quantity);
      const usedInSales = Number(row.used_in_sales);
      const usedInGifts = Number(row.used_in_gifts);
      return {
        id: row.id,
        name: row.name,
        unit: row.unit,
        imageUrl: row.image_url,
        unitCost: Number(row.unit_cost),
        available,
        usedInSales,
        usedInGifts,
        received: available + usedInSales + usedInGifts,
      };
    }),
    error: null,
  };
}
