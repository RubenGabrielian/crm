"use server";

import { revalidatePath } from "next/cache";
import { createAuthClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/tenant/get-current-tenant";

type Result = { ok: boolean; error: string | null };

const MAX_NAME_LENGTH = 40;

/** Set (or clear, with an empty string) where one order came from. */
export async function updateOrderSource(
  orderId: string,
  source: string,
): Promise<Result> {
  const supabase = await createAuthClient();
  const tenant = await getCurrentTenant();
  const name = source.trim();
  const failed = {
    ok: false,
    error: "Չհաջողվեց փոխել աղբյուրը։ Փորձեք կրկին։",
  };

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
  const supabase = await createAuthClient();
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
    if (error.code === "23505")
      return { ok: false, error: "Այս աղբյուրն արդեն կա" };
    console.error("adding order source failed:", error);
    return { ok: false, error: "Չհաջողվեց ավելացնել։ Փորձեք կրկին։" };
  }

  revalidatePath("/orders");
  return { ok: true, error: null };
}

/** Renames an option; orders that used the old name get the new one too. */
export async function renameOrderSource(
  sourceId: string,
  name: string,
): Promise<Result> {
  const supabase = await createAuthClient();
  const tenant = await getCurrentTenant();
  const trimmed = name.trim().replace(/\s+/g, " ");

  if (!trimmed) return { ok: false, error: "Մուտքագրեք անվանումը" };
  if (trimmed.length > MAX_NAME_LENGTH) {
    return { ok: false, error: `Առավելագույնը ${MAX_NAME_LENGTH} նիշ` };
  }

  const { data: current } = await supabase
    .from("order_sources")
    .select("name")
    .eq("id", sourceId)
    .eq("tenant_id", tenant.id)
    .maybeSingle();
  if (!current) return { ok: false, error: "Աղբյուրը չի գտնվել։ Թարմացրեք էջը։" };
  if (current.name === trimmed) return { ok: true, error: null };

  const { error } = await supabase
    .from("order_sources")
    .update({ name: trimmed })
    .eq("id", sourceId)
    .eq("tenant_id", tenant.id);
  if (error) {
    if (error.code === "23505")
      return { ok: false, error: "Այս աղբյուրն արդեն կա" };
    console.error("renaming order source failed:", error);
    return { ok: false, error: "Չհաջողվեց պահպանել։ Փորձեք կրկին։" };
  }

  // Orders store the name itself, so move them to the new one.
  const { error: ordersError } = await supabase
    .from("orders")
    .update({ source: trimmed })
    .eq("tenant_id", tenant.id)
    .eq("source", current.name);
  if (ordersError) {
    console.error("renaming source on orders failed:", ordersError);
    revalidatePath("/orders");
    return {
      ok: false,
      error: "Աղբյուրը վերանվանվեց, բայց հին պատվերներում՝ ոչ։ Փորձեք կրկին։",
    };
  }

  revalidatePath("/orders");
  revalidatePath("/dashboard");
  return { ok: true, error: null };
}

/** Removes the option from the list. Orders that already use it keep the name. */
export async function deleteOrderSource(sourceId: string): Promise<Result> {
  const supabase = await createAuthClient();
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
