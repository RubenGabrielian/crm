"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { getCurrentTenant } from "@/lib/tenant/get-current-tenant";

export type StockChange = "receive" | "gift";

/** Add newly received units, or write units off as gifts. */
export async function adjustStock(
  productId: string,
  kind: StockChange,
  quantity: number,
): Promise<{ ok: boolean; error: string | null }> {
  const tenant = await getCurrentTenant();

  if (!Number.isInteger(quantity) || quantity < 1) {
    return { ok: false, error: "Մուտքագրեք 1 կամ ավելի ամբողջ թիվ" };
  }

  const { error } = await supabase.rpc("adjust_stock", {
    p_tenant_id: tenant.id,
    p_product_id: productId,
    p_received: kind === "receive" ? quantity : 0,
    p_gifted: kind === "gift" ? quantity : 0,
  });

  if (error) {
    if (error.message.includes("out_of_stock")) {
      return { ok: false, error: "Պահեստում այդքան քանակ չկա" };
    }
    console.error("adjust_stock failed:", error);
    return { ok: false, error: "Չհաջողվեց պահպանել։ Փորձեք կրկին։" };
  }

  revalidatePath("/inventory");
  revalidatePath("/catalog");
  return { ok: true, error: null };
}

/**
 * Corrects a product's warehouse numbers after a count. "Sold" comes from
 * orders, so the difference is stored as a correction on top of them.
 */
export async function setStockCounts(
  productId: string,
  counts: { available: number; sold: number; gifted: number },
): Promise<{ ok: boolean; error: string | null }> {
  const tenant = await getCurrentTenant();
  for (const value of Object.values(counts)) {
    if (!Number.isInteger(value) || value < 0) {
      return { ok: false, error: "Մուտքագրեք 0 կամ ավելի ամբողջ թվեր" };
    }
  }

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("qty")
    .eq("tenant_id", tenant.id)
    .eq("product_id", productId);
  if (ordersError) {
    console.error("loading orders for stock counts failed:", ordersError);
    return { ok: false, error: "Չհաջողվեց պահպանել։ Փորձեք կրկին։" };
  }
  const soldInOrders = orders.reduce((sum, order) => sum + order.qty, 0);

  const { data, error } = await supabase
    .from("inventory")
    .update({
      stock_quantity: counts.available,
      gift_quantity: counts.gifted,
      sold_adjustment: counts.sold - soldInOrders,
      updated_at: new Date().toISOString(),
    })
    .eq("product_id", productId)
    .eq("tenant_id", tenant.id)
    .select("id");
  if (error || data.length === 0) {
    if (error) console.error("setting stock counts failed:", error);
    return { ok: false, error: "Չհաջողվեց պահպանել։ Փորձեք կրկին։" };
  }

  revalidatePath("/inventory");
  revalidatePath("/catalog");
  revalidatePath("/dashboard");
  return { ok: true, error: null };
}
