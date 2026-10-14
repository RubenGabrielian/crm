"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { getCurrentTenant } from "@/lib/tenant/get-current-tenant";

export type MaterialFormState = {
  ok: boolean;
  values: Record<string, string>;
  errors: Record<string, string>;
  formError: string | null;
};

const SAVE_FAILED = "Չհաջողվեց պահպանել։ Փորձեք կրկին։";

function revalidateMaterialPages() {
  revalidatePath("/inventory");
  revalidatePath("/catalog");
}

function readForm(formData: FormData) {
  const read = (name: string) => String(formData.get(name) ?? "").trim();
  const values = {
    name: read("name"),
    unit: read("unit") || "հատ",
    quantity: read("quantity"),
    unit_cost: read("unit_cost"),
    used_in_sales: read("used_in_sales"),
    used_in_gifts: read("used_in_gifts"),
  };
  const errors: Record<string, string> = {};
  if (!values.name) errors.name = "Պարտադիր դաշտ է";
  else if (values.name.length > 80) errors.name = "Առավելագույնը 80 նիշ";
  if (values.unit.length > 12) errors.unit = "Առավելագույնը 12 նիշ";
  const quantity = values.quantity === "" ? 0 : Number(values.quantity);
  if (!Number.isFinite(quantity)) errors.quantity = "Մուտքագրեք թիվ";
  const used = (name: "used_in_sales" | "used_in_gifts") => {
    const number = values[name] === "" ? 0 : Number(values[name]);
    if (!Number.isFinite(number) || number < 0)
      errors[name] = "Մուտքագրեք 0 կամ ավելի";
    return number;
  };
  const unitCost = values.unit_cost === "" ? 0 : Number(values.unit_cost);
  if (!Number.isFinite(unitCost) || unitCost < 0)
    errors.unit_cost = "Մուտքագրեք 0 կամ ավելի";
  return {
    values,
    errors,
    quantity,
    unitCost,
    usedInSales: used("used_in_sales"),
    usedInGifts: used("used_in_gifts"),
  };
}

/** New material with its starting quantity. */
export async function createMaterial(
  _prev: MaterialFormState,
  formData: FormData,
): Promise<MaterialFormState> {
  const tenant = await getCurrentTenant();
  const { values, errors, quantity, unitCost } = readForm(formData);
  if (quantity < 0) errors.quantity = "Մուտքագրեք 0 կամ ավելի";
  if (Object.keys(errors).length > 0)
    return { ok: false, values, errors, formError: null };

  const { error } = await supabase.from("materials").insert({
    tenant_id: tenant.id,
    name: values.name,
    unit: values.unit,
    stock_quantity: quantity,
    unit_cost: unitCost,
  });
  if (error) {
    console.error("creating material failed:", error);
    return { ok: false, values, errors: {}, formError: SAVE_FAILED };
  }

  revalidateMaterialPages();
  return { ok: true, values: {}, errors: {}, formError: null };
}

/** Rename, change unit, or correct the available quantity after a count. */
export async function updateMaterial(
  materialId: string,
  _prev: MaterialFormState,
  formData: FormData,
): Promise<MaterialFormState> {
  const tenant = await getCurrentTenant();
  const { values, errors, quantity, unitCost, usedInSales, usedInGifts } =
    readForm(formData);
  if (Object.keys(errors).length > 0)
    return { ok: false, values, errors, formError: null };

  const { data, error } = await supabase
    .from("materials")
    .update({
      name: values.name,
      unit: values.unit,
      stock_quantity: quantity,
      unit_cost: unitCost,
      used_in_sales: usedInSales,
      used_in_gifts: usedInGifts,
      updated_at: new Date().toISOString(),
    })
    .eq("id", materialId)
    .eq("tenant_id", tenant.id)
    .select("id");
  if (error || data.length === 0) {
    if (error) console.error("updating material failed:", error);
    return { ok: false, values, errors: {}, formError: SAVE_FAILED };
  }

  revalidateMaterialPages();
  return { ok: true, values: {}, errors: {}, formError: null };
}

/** Add newly received stock. */
export async function receiveMaterial(
  materialId: string,
  quantity: number,
): Promise<{ ok: boolean; error: string | null }> {
  const tenant = await getCurrentTenant();
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { ok: false, error: "Մուտքագրեք 0-ից մեծ թիվ" };
  }
  const { error } = await supabase.rpc("adjust_material", {
    p_tenant_id: tenant.id,
    p_material_id: materialId,
    p_received: quantity,
  });
  if (error) {
    console.error("adjust_material failed:", error);
    return { ok: false, error: SAVE_FAILED };
  }
  revalidateMaterialPages();
  return { ok: true, error: null };
}

/** Deletes the material and removes it from every product that used it. */
export async function deleteMaterial(
  materialId: string,
): Promise<{ ok: boolean; error: string | null }> {
  const tenant = await getCurrentTenant();
  const { error } = await supabase
    .from("materials")
    .delete()
    .eq("id", materialId)
    .eq("tenant_id", tenant.id);
  if (error) {
    console.error("deleting material failed:", error);
    return { ok: false, error: "Չհաջողվեց ջնջել։ Փորձեք կրկին։" };
  }
  revalidateMaterialPages();
  return { ok: true, error: null };
}
