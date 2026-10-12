"use server";

import { supabase } from "@/lib/supabase";
import { getCurrentTenant } from "@/lib/tenant/get-current-tenant";

/** How many of the current tenant's orders are still in the "new" status. */
export async function getNewOrderCount(): Promise<number> {
  const tenant = await getCurrentTenant();
  const { count, error } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenant.id)
    .eq("status", "new");

  if (error) {
    console.error("counting new orders failed:", error);
    return 0;
  }
  return count ?? 0;
}
