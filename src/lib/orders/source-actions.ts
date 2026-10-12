"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { getCurrentTenant } from "@/lib/tenant/get-current-tenant";

type Result = { ok: boolean; error: string | null };

const MAX_NAME_LENGTH = 40;

/** Set (or clear, with an empty string) where one order came from. */
export async function updateOrderSource(orderId: string, source: string): Promise<Result> {
  const tenant = await getCurrentTenant();
  const name = source.trim();
  const failed = { ok: false, error: "Չհաջողվեց փոխել աղբյուրը։ Փորձեք կրկին։" };

  if (name) {
    // Only names from the tenant's own list are accepted.
    const { data: option } = await supabase
      .from("order_sources")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("name", name)
      .maybeSingle();
    if (!option) return failed;
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ source: name || null })
    .eq("id", orderId)
    .eq("tenant_id", tenant.id)
    .select("id");

  if (error || data.length === 0) {
    if (error) console.error("updating order source failed:", error);
    return failed;
  }

  revalidatePath("/orders");
  return { ok: true, error: null };
}

export async function addOrderSource(name: string): Promise<Result> {
  const tenant = await getCurrentTenant();
  const trimmed = name.trim().replace(/\s+/g, " ");

  if (!trimmed) return { ok: false, error: "Մուտքագրեք անվանումը" };
  if (trimmed.length > MAX_NAME_LENGTH) {
    return { ok: false, error: `Առավելագույնը ${MAX_NAME_LENGTH} նիշ` };
  }

  const { error } = await supabase
    .from("order_sources")
    .insert({ tenant_id: tenant.id, name: trimmed });

  if (error) {
    if (error.code === "23505") return { ok: false, error: "Այս աղբյուրն արդեն կա" };
    console.error("adding order source failed:", error);
    return { ok: false, error: "Չհաջողվեց ավելացնել։ Փորձեք կրկին։" };
  }

  revalidatePath("/orders");
  return { ok: true, error: null };
}

/** Removes the option from the list. Orders that already use it keep the name. */
export async function deleteOrderSource(sourceId: string): Promise<Result> {
  const tenant = await getCurrentTenant();

  const { error } = await supabase
    .from("order_sources")
    .delete()
    .eq("id", sourceId)
    .eq("tenant_id", tenant.id);

  if (error) {
    console.error("deleting order source failed:", error);
    return { ok: false, error: "Չհաջողվեց ջնջել։ Փորձեք կրկին։" };
  }

  revalidatePath("/orders");
  return { ok: true, error: null };
}
