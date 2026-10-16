"use server";

import { randomBytes } from "node:crypto";
import { isDeliveryFee, isSalePercent, signSale } from "./sale-link";
import { supabase } from "@/lib/supabase";
import { getCurrentTenant } from "@/lib/tenant/get-current-tenant";

/**
 * Query string ("?sale=15&delivery=0&sig=…&ref=…") for a checkout link with a
 * sale, its own delivery fee and/or a private admin note. Pass delivery null to
 * keep the product's own. The note is stored server-side; the link only gets
 * its random id, so the customer never sees it.
 */
export async function createSaleLinkQuery(
  productId: string,
  percent: number,
  delivery: number | null = null,
  note = "",
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

  const params = new URLSearchParams();
  if (percent > 0 || delivery !== null) {
    const sig = signSale(product.id, { percent, delivery });
    if (!sig) {
      console.error(
        "sale link: CHECKOUT_LINK_SECRET / SUPABASE_SECRET_KEY is not set",
      );
      return { query: null, error: "Չհաջողվեց ստեղծել հղումը։" };
    }
    if (percent > 0) params.set("sale", String(percent));
    if (delivery !== null) params.set("delivery", String(delivery));
    params.set("sig", sig);
  }

  const text = note.trim().slice(0, 2000);
  if (text) {
    const ref = randomBytes(9).toString("base64url");
    const { error } = await supabase.from("checkout_link_notes").insert({
      id: ref,
      tenant_id: tenant.id,
      product_id: product.id,
      note: text,
    });
    if (error) {
      console.error("saving checkout link note failed:", error);
      return { query: null, error: "Չհաջողվեց պահել նշումը։ Փորձեք կրկին։" };
    }
    params.set("ref", ref);
  }
  return { query: params.size ? `?${params}` : "", error: null };
}
