"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { getCurrentTenant } from "@/lib/tenant/get-current-tenant";

export type CustomerFormState = {
  ok: boolean;
  values: Record<string, string>;
  errors: Record<string, string>;
  formError: string | null;
};

const REQUIRED = "Պարտադիր դաշտ է";

/** Accepts "@name", "name" or a full instagram.com link; returns just the username. */
function parseInstagram(raw: string): string | null {
  const username = raw
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/[/?#].*$/, "");
  return /^[A-Za-z0-9._]{1,30}$/.test(username) ? username : null;
}

export async function updateCustomer(
  customerId: string,
  _prev: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const tenant = await getCurrentTenant();
  const read = (name: string) => String(formData.get(name) ?? "").trim();
  const values = {
    name: read("name"),
    phone: read("phone"),
    email: read("email"),
    instagram: read("instagram"),
  };
  const errors: Record<string, string> = {};

  if (!values.name) errors.name = REQUIRED;

  const phone = values.phone.replace(/[\s\-()]/g, "");
  if (!phone) errors.phone = REQUIRED;
  else if (!/^\+?\d{8,15}$/.test(phone)) errors.phone = "Մուտքագրեք ճիշտ հեռախոսահամար";

  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Մուտքագրեք ճիշտ էլ. հասցե";
  }

  const instagram = values.instagram ? parseInstagram(values.instagram) : null;
  if (values.instagram && !instagram) {
    errors.instagram = "Մուտքագրեք Instagram-ի օգտանունը, օրինակ՝ @anun";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, values, errors, formError: null };
  }

  const { data, error } = await supabase
    .from("customers")
    .update({
      name: values.name,
      phone,
      email: values.email || null,
      social_handle: instagram,
    })
    .eq("id", customerId)
    .eq("tenant_id", tenant.id)
    .select("id");

  if (error?.code === "23505") {
    return {
      ok: false,
      values,
      errors: { phone: "Այս համարով այլ հաճախորդ արդեն կա" },
      formError: null,
    };
  }
  if (error || data.length === 0) {
    if (error) console.error("updating customer failed:", error);
    return {
      ok: false,
      values,
      errors: {},
      formError: "Չհաջողվեց պահպանել։ Փորձեք կրկին։",
    };
  }

  revalidatePath("/customers", "layout");
  revalidatePath("/orders");
  return { ok: true, values: {}, errors: {}, formError: null };
}

/** Admin's private note about a customer; an empty comment clears it. */
export async function updateCustomerComment(
  customerId: string,
  comment: string,
): Promise<{ ok: boolean; error: string | null }> {
  const tenant = await getCurrentTenant();
  const text = comment.trim();
  if (text.length > 2000) {
    return { ok: false, error: "Մեկնաբանությունը չափազանց երկար է (առավելագույնը 2000 նիշ)" };
  }

  const { data, error } = await supabase
    .from("customers")
    .update({ comment: text || null })
    .eq("id", customerId)
    .eq("tenant_id", tenant.id)
    .select("id");

  if (error || data.length === 0) {
    if (error) console.error("updating customer comment failed:", error);
    return { ok: false, error: "Չհաջողվեց պահպանել։ Փորձեք կրկին։" };
  }

  revalidatePath("/customers", "layout");
  return { ok: true, error: null };
}
