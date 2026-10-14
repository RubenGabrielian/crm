"use server";

import { isDeliveryFee, isSalePercent, signSale } from "./sale-link";
import { supabase } from "@/lib/supabase";
import { getCurrentTenant } from "@/lib/tenant/get-current-tenant";

/**
 * Query string ("?sale=15&delivery=0&sig=…") for a checkout link with a sale
 * and/or its own delivery fee. Pass delivery null to keep the product's own.
 */
export async function createSaleLinkQuery(
  productId: string,
  percent: number,
  delivery: number | null = null,
): Promise<{ query: string | null; error: string | null }> {
  const tenant = await getCurrentTenant();
  if (!isSalePercent(percent)) {
    return { query: null, error: "Զեղչը՝ 0-ից 100 ամբողջ թիվ" };
  }
  if (delivery !== null && !isDeliveryFee(delivery)) {
    return { query: null, error: "Առաքման արժեքը՝ 0 կամ ավելի" };
  }

  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("tenant_id", tenant.id)
    .maybeSingle();
  if (!product)
    return { query: null, error: "Ապրանքը չի գտնվել։ Թարմացրեք էջը։" };

  const sig = signSale(product.id, { percent, delivery });
  if (!sig) {
    console.error(
      "sale link: CHECKOUT_LINK_SECRET / SUPABASE_SECRET_KEY is not set",
    );
    return { query: null, error: "Չհաջողվեց ստեղծել հղումը։" };
  }
  const params = new URLSearchParams();
  if (percent > 0) params.set("sale", String(percent));
  if (delivery !== null) params.set("delivery", String(delivery));
  params.set("sig", sig);
  return { query: `?${params}`, error: null };
}
