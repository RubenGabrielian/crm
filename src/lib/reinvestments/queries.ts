import "server-only";

import type { ReinvestmentStatus } from "@/config/reinvestments";
import { supabase } from "@/lib/supabase";

export type Reinvestment = {
  id: string;
  date: string;
  purpose: string;
  /** Null when the investment isn't tied to one product. */
  productTitle: string | null;
  amount: number;
  status: ReinvestmentStatus;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function listReinvestments(
  tenantId: string,
): Promise<{ reinvestments: Reinvestment[]; error: string | null }> {
  const { data, error } = await supabase
    .from("reinvestments")
    .select("id, invest_date, purpose, amount, status, products(title)")
    .eq("tenant_id", tenantId)
    .order("invest_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return { reinvestments: [], error: error.message };

  return {
    reinvestments: data.map((row) => ({
      id: row.id,
      date: row.invest_date,
      purpose: row.purpose,
      productTitle: one(row.products)?.title ?? null,
      amount: Number(row.amount),
      status: row.status as ReinvestmentStatus,
    })),
    error: null,
  };
}
