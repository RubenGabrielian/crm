import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { getAdminClient } from "@/lib/supabase/admin";
import { createAuthClient } from "@/lib/supabase/server";
import { isBusinessType, type Tenant } from "./features";
import {
  canAny,
  cleanPermissions,
  homePath,
  type Access,
  type Permission,
} from "./permissions";

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

/** The business the signed-in user works at, and what they may do there. */
export type Membership = {
  tenant: Tenant;
  /** Whose subscription the business runs on. */
  ownerId: string | null;
  access: Access;
};

/**
 * The business where this user is an employee, or null. The first time an
 * employee signs in, their row (found by the verified email) is tied to their
 * account, so from then on the database knows them by user id.
 */
export async function findMembership(user: CurrentUser): Promise<Membership | null> {
  const supabase = await createAuthClient();
  const select = "full_name, permissions, tenants(id, name, business_type, owner_id)";

  let { data, error } = await supabase
    .from("tenant_members")
    .select(select)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data && !error && user.email) {
    const admin = getAdminClient();
    if (admin) {
      const { data: linked, error: linkError } = await admin
        .from("tenant_members")
        .update({ user_id: user.id })
        .eq("email", user.email.toLowerCase())
        .is("user_id", null)
        .select("id");
      if (linkError) console.error("linking employee failed:", linkError);
      if (linked?.length) {
        ({ data, error } = await supabase
          .from("tenant_members")
          .select(select)
          .eq("user_id", user.id)
          .maybeSingle());
      }
    }
  }

  if (error) {
    console.error("loading membership failed:", error);
    return null;
  }
  // One member row belongs to one business.
  const tenant = data?.tenants as unknown as
    | { id: string; name: string; business_type: string; owner_id: string | null }
    | null
    | undefined;
  if (!data || !tenant || !isBusinessType(tenant.business_type)) return null;
  return {
    tenant: { id: tenant.id, name: tenant.name, businessType: tenant.business_type },
    ownerId: tenant.owner_id,
    access: {
      role: "employee",
      name: data.full_name,
      permissions: cleanPermissions(data.permissions ?? []),
    },
  };
}

/**
 * The signed-in user's business, owned or worked at. Every admin page and
 * action goes through this: no session sends you to login, no business sends
 * you to onboarding.
 */
export const getCurrentMembership = cache(async (): Promise<Membership> => {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const tenant = await findTenantByOwner(user.id);
  if (tenant) return { tenant, ownerId: user.id, access: { role: "owner" } };

  const membership = await findMembership(user);
  if (!membership) redirect("/onboarding");
  return membership;
});

/** The signed-in user's business. */
export const getCurrentTenant = cache(
  async (): Promise<Tenant> => (await getCurrentMembership()).tenant,
);

/** What the signed-in user may see and do. */
export async function getCurrentAccess(): Promise<Access> {
  return (await getCurrentMembership()).access;
}

/**
 * The signed-in user's business, if they have any of these permissions;
 * otherwise sends them to a page they may open. Pages and actions call this.
 */
export async function requirePermission(
  ...permissions: Permission[]
): Promise<Tenant> {
  const { tenant, access } = await getCurrentMembership();
  if (!canAny(access, permissions)) redirect(homePath());
  return tenant;
}

/** For owner-only pages and actions (employees, billing). */
export async function requireOwner(): Promise<Tenant> {
  const { tenant, access } = await getCurrentMembership();
  if (access.role !== "owner") redirect(homePath());
  return tenant;
}
