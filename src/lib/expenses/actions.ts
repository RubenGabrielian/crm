"use server";

import { revalidatePath } from "next/cache";
import { isExpenseCategory } from "@/config/expenses";
import { addDays } from "@/lib/analytics/range";
import { supabase } from "@/lib/supabase";
import { getCurrentTenant } from "@/lib/tenant/get-current-tenant";

export type ExpenseFormState = {
  ok: boolean;
  values: Record<string, string>;
  errors: Record<string, string>;
  formError: string | null;
};

const REQUIRED = "Պարտադիր դաշտ է";

function revalidateExpensePages() {
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

export async function addExpense(
  _prev: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const tenant = await getCurrentTenant();
  const read = (name: string) => String(formData.get(name) ?? "").trim();
  const values = {
    date: read("date"),
    category: read("category"),
    description: read("description"),
    amount: read("amount"),
  };
  const errors: Record<string, string> = {};

  if (!values.date) errors.date = REQUIRED;
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date) || Number.isNaN(Date.parse(values.date))) {
    errors.date = "Մուտքագրեք ճիշտ ամսաթիվ";
  }

  if (!isExpenseCategory(values.category)) errors.category = REQUIRED;

  const amount = Number(values.amount);
  if (!values.amount) errors.amount = REQUIRED;
  else if (!Number.isFinite(amount) || amount <= 0) errors.amount = "Մուտքագրեք 0-ից մեծ թիվ";

  if (values.description.length > 200) errors.description = "Առավելագույնը 200 նիշ";

  if (Object.keys(errors).length > 0) {
    return { ok: false, values, errors, formError: null };
  }

  // "Repeat every month" saves a monthly expense starting on the chosen date
  // instead of a single entry.
  const monthly = formData.get("monthly") === "on";
  const { error } = monthly
    ? await supabase.from("recurring_expenses").insert({
        tenant_id: tenant.id,
        start_date: values.date,
        expense_category: values.category,
        description: values.description || null,
        amount,
      })
    : await supabase.from("expenses").insert({
        tenant_id: tenant.id,
        expense_date: values.date,
        expense_category: values.category,
        description: values.description || null,
        amount,
      });

  if (error) {
    console.error("adding expense failed:", error);
    return {
      ok: false,
      values,
      errors: {},
      formError: "Չհաջողվեց պահպանել։ Փորձեք կրկին։",
    };
  }

  revalidateExpensePages();
  return { ok: true, values: {}, errors: {}, formError: null };
}

export async function deleteExpense(
  expenseId: string,
): Promise<{ ok: boolean; error: string | null }> {
  const tenant = await getCurrentTenant();

  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId)
    .eq("tenant_id", tenant.id);

  if (error) {
    console.error("deleting expense failed:", error);
    return { ok: false, error: "Չհաջողվեց ջնջել։ Փորձեք կրկին։" };
  }

  revalidateExpensePages();
  return { ok: true, error: null };
}

/**
 * "stop" keeps every past charge and ends the expense from today on.
 * "delete" removes it completely, including its past charges.
 */
export async function removeRecurringExpense(
  recurringId: string,
  mode: "stop" | "delete",
  today: string,
): Promise<{ ok: boolean; error: string | null }> {
  const tenant = await getCurrentTenant();
  const failed = { ok: false, error: "Չհաջողվեց պահպանել։ Փորձեք կրկին։" };

  if (mode === "delete") {
    const { error } = await supabase
      .from("recurring_expenses")
      .delete()
      .eq("id", recurringId)
      .eq("tenant_id", tenant.id);
    if (error) {
      console.error("deleting monthly expense failed:", error);
      return failed;
    }
  } else {
    const { data: existing } = await supabase
      .from("recurring_expenses")
      .select("start_date")
      .eq("id", recurringId)
      .eq("tenant_id", tenant.id)
      .maybeSingle();
    if (!existing) return failed;

    // Ends yesterday, but never before it started.
    const yesterday = addDays(today, -1);
    const endDate = yesterday < existing.start_date ? existing.start_date : yesterday;
    const { error } = await supabase
      .from("recurring_expenses")
      .update({ end_date: endDate })
      .eq("id", recurringId)
      .eq("tenant_id", tenant.id);
    if (error) {
      console.error("stopping monthly expense failed:", error);
      return failed;
    }
  }

  revalidateExpensePages();
  return { ok: true, error: null };
}
