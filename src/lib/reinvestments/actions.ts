"use server";

import { revalidatePath } from "next/cache";
import { isReinvestmentStatus } from "@/config/reinvestments";
import { createAuthClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/tenant/get-current-tenant";

export type ReinvestmentFormState = {
  ok: boolean;
  values: Record<string, string>;
  errors: Record<string, string>;
  formError: string | null;
};

type Result = { ok: boolean; error: string | null };

const REQUIRED = "Պարտադիր դաշտ է";

export async function addReinvestment(
  _prev: ReinvestmentFormState,
  formData: FormData,
): Promise<ReinvestmentFormState> {
  const supabase = await createAuthClient();
  const tenant = await getCurrentTenant();
  const read = (name: string) => String(formData.get(name) ?? "").trim();
  const values = {
    date: read("date"),
    purpose: read("purpose"),
    product_id: read("product_id"),
    amount: read("amount"),
    status: read("status"),
  };
  const errors: Record<string, string> = {};

  if (!values.date) errors.date = REQUIRED;
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date) || Number.isNaN(Date.parse(values.date))) {
    errors.date = "Մուտքագրեք ճիշտ ամսաթիվ";
  }

  if (!values.purpose) errors.purpose = REQUIRED;
  else if (values.purpose.length > 200) errors.purpose = "Առավելագույնը 200 նիշ";

  const amount = Number(values.amount);
  if (!values.amount) errors.amount = REQUIRED;
  else if (!Number.isFinite(amount) || amount <= 0) errors.amount = "Մուտքագրեք 0-ից մեծ թիվ";

  if (!isReinvestmentStatus(values.status)) errors.status = REQUIRED;

  if (Object.keys(errors).length > 0) {
    return { ok: false, values, errors, formError: null };
  }

  const { error } = await supabase.from("reinvestments").insert({
    tenant_id: tenant.id,
    invest_date: values.date,
    purpose: values.purpose,
    // The database only accepts a product that belongs to this tenant.
    product_id: values.product_id || null,
    amount,
    status: values.status,
  });

  if (error) {
    if (error.code === "23503" || error.code === "22P02") {
      return { ok: false, values, errors: { product_id: "Ընտրեք ապրանքը ցանկից" }, formError: null };
    }
    console.error("adding reinvestment failed:", error);
    return { ok: false, values, errors: {}, formError: "Չհաջողվեց պահպանել։ Փորձեք կրկին։" };
  }

  revalidatePath("/reinvestments");
  return { ok: true, values: {}, errors: {}, formError: null };
}

export async function updateReinvestmentStatus(id: string, status: string): Promise<Result> {
  const supabase = await createAuthClient();
  const tenant = await getCurrentTenant();
  const failed = { ok: false, error: "Չհաջողվեց փոխել կարգավիճակը։ Փորձեք կրկին։" };
  if (!isReinvestmentStatus(status)) return failed;

  const { data, error } = await supabase
    .from("reinvestments")
    .update({ status })
    .eq("id", id)
    .eq("tenant_id", tenant.id)
    .select("id");

  if (error || data.length === 0) {
    if (error) console.error("updating reinvestment status failed:", error);
    return failed;
  }

  revalidatePath("/reinvestments");
  return { ok: true, error: null };
}

export async function deleteReinvestment(id: string): Promise<Result> {
  const supabase = await createAuthClient();
  const tenant = await getCurrentTenant();

  const { error } = await supabase
    .from("reinvestments")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenant.id);

  if (error) {
    console.error("deleting reinvestment failed:", error);
    return { ok: false, error: "Չհաջողվեց ջնջել։ Փորձեք կրկին։" };
  }

  revalidatePath("/reinvestments");
  return { ok: true, error: null };
}
