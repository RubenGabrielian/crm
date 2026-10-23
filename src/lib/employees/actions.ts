"use server";

import { revalidatePath } from "next/cache";
import { getAdminClient } from "@/lib/supabase/admin";
import { createAuthClient } from "@/lib/supabase/server";
import { sendEmployeeInvite } from "./invite";
import { getCurrentUser, requireOwner } from "@/lib/tenant/get-current-tenant";
import { cleanPermissions, isPagePermission } from "@/lib/tenant/permissions";

export type EmployeeFormState = {
  ok: boolean;
  values: Record<string, string>;
  errors: Record<string, string>;
  formError: string | null;
};

type Result = { ok: boolean; error: string | null };

const REQUIRED = "Պարտադիր դաշտ է";
const SAVE_FAILED = "Չհաջողվեց պահպանել։ Փորձեք կրկին։";

/**
 * Makes sure the employee has an account, so the login page sends them a
 * code. Ties the new account to their row right away; an address that already
 * has an account is tied the first time that person signs in.
 */
async function ensureAccount(memberId: string, email: string, fullName: string) {
  const admin = getAdminClient();
  if (!admin) return;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) {
    if (error.code !== "email_exists") console.error("creating employee account failed:", error);
    return;
  }
  const { error: linkError } = await admin
    .from("tenant_members")
    .update({ user_id: data.user.id })
    .eq("id", memberId);
  if (linkError) console.error("linking employee account failed:", linkError);
}

/**
 * Adds an employee (no id) or changes one's name and permissions. The email
 * is what they sign in with, so it is set once and not changed later.
 */
export async function saveEmployee(
  _prev: EmployeeFormState,
  formData: FormData,
): Promise<EmployeeFormState> {
  const tenant = await requireOwner();
  const id = String(formData.get("id") ?? "");
  const values = {
    full_name: String(formData.get("full_name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
  };
  const permissions = cleanPermissions(formData.getAll("permissions"));
  const errors: Record<string, string> = {};

  if (!values.full_name) errors.full_name = REQUIRED;
  else if (values.full_name.length > 80) errors.full_name = "Առավելագույնը 80 նիշ";
  if (!id) {
    const user = await getCurrentUser();
    if (!values.email) errors.email = REQUIRED;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      errors.email = "Մուտքագրեք ճիշտ էլ. հասցե";
    } else if (values.email === user?.email?.toLowerCase()) {
      errors.email = "Սա ձեր սեփական հասցեն է";
    }
  }
  if (!permissions.some(isPagePermission)) {
    errors.permissions = "Ընտրեք գոնե մեկ էջ";
  }
  if (Object.keys(errors).length > 0) {
    return { ok: false, values, errors, formError: null };
  }

  const supabase = await createAuthClient();
  if (id) {
    const { error } = await supabase
      .from("tenant_members")
      .update({ full_name: values.full_name, permissions })
      .eq("id", id)
      .eq("tenant_id", tenant.id);
    if (error) {
      console.error("updating employee failed:", error);
      return { ok: false, values, errors: {}, formError: SAVE_FAILED };
    }
  } else {
    const { data, error } = await supabase
      .from("tenant_members")
      .insert({
        tenant_id: tenant.id,
        email: values.email,
        full_name: values.full_name,
        permissions,
      })
      .select("id")
      .single();
    if (error?.code === "23505") {
      return {
        ok: false,
        values,
        errors: { email: "Այս էլ. հասցեով աշխատակից արդեն կա" },
        formError: null,
      };
    }
    if (error) {
      console.error("adding employee failed:", error);
      return { ok: false, values, errors: {}, formError: SAVE_FAILED };
    }
    await ensureAccount(data.id, values.email, values.full_name);
    await sendEmployeeInvite({
      to: values.email,
      fullName: values.full_name,
      businessName: tenant.name,
    });
  }

  revalidatePath("/employees");
  return { ok: true, values: {}, errors: {}, formError: null };
}

/** Removes an employee; from their next page on they no longer get in. */
export async function deleteEmployee(id: string): Promise<Result> {
  const tenant = await requireOwner();
  const supabase = await createAuthClient();
  const { error } = await supabase
    .from("tenant_members")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenant.id);
  if (error) {
    console.error("deleting employee failed:", error);
    return { ok: false, error: "Չհաջողվեց հեռացնել։ Փորձեք կրկին։" };
  }
  revalidatePath("/employees");
  return { ok: true, error: null };
}
