import "server-only";

import { createAuthClient } from "@/lib/supabase/server";
import { cleanPermissions, type Permission } from "@/lib/tenant/permissions";

export type Employee = {
  id: string;
  fullName: string;
  email: string;
  permissions: Permission[];
  /** False until the employee signs in for the first time. */
  joined: boolean;
  createdAt: string;
};

/** The business's employees, oldest first. Only the owner can read them (RLS). */
export async function listEmployees(
  tenantId: string,
): Promise<{ employees: Employee[]; error: unknown }> {
  const supabase = await createAuthClient();
  const { data, error } = await supabase
    .from("tenant_members")
    .select("id, full_name, email, permissions, user_id, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at");

  if (error) return { employees: [], error };
  return {
    employees: (data ?? []).map((row) => ({
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      permissions: cleanPermissions(row.permissions ?? []),
      joined: row.user_id !== null,
      createdAt: row.created_at,
    })),
    error: null,
  };
}
