import "server-only";

import type { DateRange } from "@/lib/analytics/range";
import { RETIRED_PERSONAL_CATEGORY } from "@/config/expenses";
import { createAuthClient } from "@/lib/supabase/server";
import { chargeDates, type RecurringExpense } from "./recurring";

export type Expense = {
  id: string;
  date: string;
  category: string;
  description: string | null;
  amount: number;
  /** True for a charge that comes from a monthly expense. */
  monthly: boolean;
  /** Unpaid expenses are listed but left out of every total. */
  paid: boolean;
  costType: "fixed" | "variable";
};

export async function listExpenses(
  tenantId: string,
  range: DateRange,
): Promise<{ expenses: Expense[]; error: string | null }> {
  const supabase = await createAuthClient();
  const { data, error } = await supabase
    .from("expenses")
    .select(
      "id, expense_date, expense_category, description, amount, is_paid, cost_type",
    )
    .eq("tenant_id", tenantId)
    .neq("expense_category", RETIRED_PERSONAL_CATEGORY)
    .gte("expense_date", range.from)
    .lte("expense_date", range.to)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return { expenses: [], error: error.message };

  return {
    expenses: data.map((row) => ({
      id: row.id,
      date: row.expense_date,
      category: row.expense_category,
      description: row.description,
      amount: Number(row.amount),
      monthly: false,
      paid: row.is_paid,
      costType: row.cost_type === "variable" ? "variable" : "fixed",
    })),
    error: null,
  };
}

/**
 * How many expenses the tenant ever added, one-off and monthly together.
 * Free accounts are limited by this number. Null (with a log line) if it can't be read.
 */
export async function countAllExpenses(tenantId: string): Promise<number | null> {
  const supabase = await createAuthClient();
  const [oneOff, monthly] = await Promise.all([
    supabase
      .from("expenses")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
    supabase
      .from("recurring_expenses")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
  ]);
  if (oneOff.error || monthly.error) {
    console.error("countAllExpenses failed:", oneOff.error ?? monthly.error);
    return null;
  }
  return (oneOff.count ?? 0) + (monthly.count ?? 0);
}

/** Monthly expenses of the tenant. Empty (with a log line) if they can't be read. */
export async function listRecurringExpenses(
  tenantId: string,
): Promise<RecurringExpense[]> {
  const supabase = await createAuthClient();
  const { data, error } = await supabase
    .from("recurring_expenses")
    .select(
      "id, expense_category, description, amount, start_date, end_date, cost_type",
    )
    .eq("tenant_id", tenantId)
    .neq("expense_category", RETIRED_PERSONAL_CATEGORY)
    .order("created_at");

  if (error) {
    console.error("listRecurringExpenses failed:", error);
    return [];
  }
  return data.map((row) => ({
    id: row.id,
    category: row.expense_category,
    description: row.description,
    amount: Number(row.amount),
    costType: row.cost_type === "variable" ? "variable" : "fixed",
    startDate: row.start_date,
    endDate: row.end_date,
  }));
}

/** Each monthly expense expanded into one charge per month inside the range. */
export function monthlyCharges(
  recurring: RecurringExpense[],
  range: DateRange,
  today: string,
): Expense[] {
  return recurring.flatMap((expense) =>
    chargeDates(expense, range.from, range.to, today).map((date) => ({
      id: `${expense.id}:${date}`,
      date,
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      monthly: true,
      paid: true,
      costType: expense.costType,
    })),
  );
}
