import "server-only";

import { createAuthClient } from "@/lib/supabase/server";
import { getCurrentAccess } from "@/lib/tenant/get-current-tenant";
import { can } from "@/lib/tenant/permissions";

export type Material = {
  id: string;
  name: string;
  unit: string;
  imageUrl: string | null;
  /**
   * Price of one unit, part of each product's variable cost. 0 for people
   * without "cost_view", who never get the real value.
   */
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
  const showCost = can(await getCurrentAccess(), "cost_view");

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
        unitCost: showCost ? Number(row.unit_cost) : 0,
        available,
        usedInSales,
        usedInGifts,
        received: available + usedInSales + usedInGifts,
      };
    }),
    error: null,
  };
}
