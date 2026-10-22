import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createAuthClient } from "@/lib/supabase/server";
import { isBusinessType, type Tenant } from "./features";

export type CurrentUser = {
  id: string;
  email: string | undefined;
  user_metadata: Record<string, unknown>;
};

/**
 * The signed-in user, from their session token. getClaims() verifies the
 * token's signature locally (no request to Supabase Auth), so it is fast on
 * every page. Null when nobody is signed in.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const auth = await createAuthClient();
  const { data, error } = await auth.auth.getClaims();
  if (error || !data) return null;
  const { claims } = data;
  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : undefined,
    user_metadata: (claims.user_metadata ?? {}) as Record<string, unknown>,
  };
});

/** The business owned by the given user, or null if they haven't created one yet. */
export async function findTenantByOwner(ownerId: string): Promise<Tenant | null> {
  const supabase = await createAuthClient();
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
