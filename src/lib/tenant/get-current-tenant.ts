import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { createAuthClient } from "@/lib/supabase/server";
import { isBusinessType, type Tenant } from "./features";

/** The signed-in user, verified with Supabase. Null when nobody is signed in. */
export const getCurrentUser = cache(async () => {
  const auth = await createAuthClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  return user;
});

/** The business owned by the given user, or null if they haven't created one yet. */
export async function findTenantByOwner(ownerId: string): Promise<Tenant | null> {
  const { data, error } = await supabase
    .from("tenants")
    .select("id, name, business_type")
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error) {
    console.error("loading tenant failed:", error);
    return null;
  }
  if (!data || !isBusinessType(data.business_type)) return null;
  return { id: data.id, name: data.name, businessType: data.business_type };
}

/**
 * The signed-in user's business. Every admin page and action goes through
 * this: no session sends you to login, no business sends you to onboarding.
 */
export const getCurrentTenant = cache(async (): Promise<Tenant> => {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const tenant = await findTenantByOwner(user.id);
  if (!tenant) redirect("/onboarding");
  return tenant;
});
