"use server";

import { isSalePercent, signSale } from "./sale-link";
import { supabase } from "@/lib/supabase";
import { getCurrentTenant } from "@/lib/tenant/get-current-tenant";

/** Query string ("?sale=15&sig=…") for a checkout link with a sale. */
export async function createSaleLinkQuery(
  productId: string,
  percent: number,
): Promise<{ query: string | null; error: string | null }> {
  const tenant = await getCurrentTenant();
  if (!isSalePercent(percent)) {
    return { query: null, error: "Մուտքագրեք 1-ից 100 ամբողջ թիվ" };
  }

  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("tenant_id", tenant.id)
    .maybeSingle();
  if (!product) return { query: null, error: "Ապրանքը չի գտնվել։ Թարմացրեք էջը։" };

  const sig = signSale(product.id, percent);
  if (!sig) {
    console.error("sale link: CHECKOUT_LINK_SECRET / SUPABASE_SECRET_KEY is not set");
    return { query: null, error: "Չհաջողվեց ստեղծել զեղչով հղումը։" };
  }
  return { query: `?sale=${percent}&sig=${sig}`, error: null };
}
