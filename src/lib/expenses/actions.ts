"use server";

import { revalidatePath } from "next/cache";
import {
  defaultCostType,
  isCostType,
  isExpenseCategory,
  type CostType,
} from "@/config/expenses";
import { addDays } from "@/lib/analytics/range";
import { FREE_EXPENSE_LIMIT } from "@/lib/billing/limits";
import { isCurrentUserPro } from "@/lib/billing/subscription";
import { countAllExpenses } from "@/lib/expenses/queries";
import { createAuthClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/tenant/get-current-tenant";

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
  const supabase = await createAuthClient();
  const tenant = await requirePermission("expenses");
  const read = (name: string) => String(formData.get(name) ?? "").trim();
  const values = {
    date: read("date"),
    category: read("category"),
    description: read("description"),
    amount: read("amount"),
    status: read("status"),
    cost_type: read("cost_type"),
  };
  const errors: Record<string, string> = {};

  if (!values.date) errors.date = REQUIRED;
  else if (
    !/^\d{4}-\d{2}-\d{2}$/.test(values.date) ||
    Number.isNaN(Date.parse(values.date))
  ) {
    errors.date = "Մուտքագրեք ճիշտ ամսաթիվ";
  }

  if (!isExpenseCategory(values.category)) errors.category = REQUIRED;

  const amount = Number(values.amount);
  if (!values.amount) errors.amount = REQUIRED;
  else if (!Number.isFinite(amount) || amount <= 0)
    errors.amount = "Մուտքագրեք 0-ից մեծ թիվ";

  if (values.description.length > 200)
    errors.description = "Առավելագույնը 200 նիշ";

  if (Object.keys(errors).length > 0) {
    return { ok: false, values, errors, formError: null };
  }

  if (!(await isCurrentUserPro())) {
    const count = await countAllExpenses(tenant.id);
    if (count === null) {
      return {
        ok: false,
        values,
        errors: {},
        formError: "Չհաջողվեց պահպանել։ Փորձեք կրկին։",
      };
    }
    if (count >= FREE_EXPENSE_LIMIT) {
      return {
        ok: false,
        values,
        errors: {},
        formError: `Անվճար տարբերակում կարելի է ավելացնել ${FREE_EXPENSE_LIMIT} ծախս։ Ակտիվացրու Numa Pro-ն՝ ավելին ավելացնելու համար։`,
      };
    }
  }

  // "Repeat every month" saves a monthly expense starting on the chosen date
  // instead of a single entry.
  const costType = isCostType(values.cost_type)
    ? values.cost_type
    : defaultCostType(values.category);
  const monthly = formData.get("monthly") === "on";
  const { error } = monthly
    ? await supabase.from("recurring_expenses").insert({
        tenant_id: tenant.id,
        start_date: values.date,
        expense_category: values.category,
        description: values.description || null,
        amount,
        cost_type: costType,
      })
    : await supabase.from("expenses").insert({
        tenant_id: tenant.id,
        expense_date: values.date,
        expense_category: values.category,
        description: values.description || null,
        amount,
        is_paid: values.status !== "unpaid",
        cost_type: costType,
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

export async function setExpensePaid(
  expenseId: string,
  paid: boolean,
): Promise<{ ok: boolean; error: string | null }> {
  const supabase = await createAuthClient();
  const tenant = await requirePermission("expenses");

  const { data, error } = await supabase
    .from("expenses")
    .update({ is_paid: paid })
    .eq("id", expenseId)
    .eq("tenant_id", tenant.id)
    .select("id");

  if (error || data.length === 0) {
    if (error) console.error("changing expense status failed:", error);
    return { ok: false, error: "Չհաջողվեց փոխել կարգավիճակը։ Փորձեք կրկին։" };
  }

  revalidateExpensePages();
  return { ok: true, error: null };
}

export async function deleteExpense(
  expenseId: string,
): Promise<{ ok: boolean; error: string | null }> {
  const supabase = await createAuthClient();
  const tenant = await requirePermission("expenses");

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
  const supabase = await createAuthClient();
  const tenant = await requirePermission("expenses");
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
    const endDate =
      yesterday < existing.start_date ? existing.start_date : yesterday;
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

/** Switch an expense between fixed and variable, straight from the table. */
export async function setExpenseCostType(
  expenseId: string,
  costType: CostType,
): Promise<{ ok: boolean; error: string | null }> {
  const supabase = await createAuthClient();
  const tenant = await requirePermission("expenses");
  if (!isCostType(costType)) return { ok: false, error: "Անհայտ տեսակ" };

  const { data, error } = await supabase
    .from("expenses")
    .update({ cost_type: costType })
    .eq("id", expenseId)
    .eq("tenant_id", tenant.id)
    .select("id");
  if (error || data.length === 0) {
    if (error) console.error("changing expense cost type failed:", error);
    return { ok: false, error: "Չհաջողվեց պահպանել։ Փորձեք կրկին։" };
  }

  revalidateExpensePages();
  return { ok: true, error: null };
}
