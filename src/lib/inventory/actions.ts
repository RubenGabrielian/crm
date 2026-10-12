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
