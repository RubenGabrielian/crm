"use server";

import { revalidatePath } from "next/cache";
import { isCurrentUserPro } from "@/lib/billing/subscription";
import { createAuthClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/tenant/get-current-tenant";

export type CustomerFormState = {
  ok: boolean;
  values: Record<string, string>;
  errors: Record<string, string>;
  formError: string | null;
  /** When the phone already belongs to a customer: that customer, to open instead. */
  existingId?: string;
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

/** Checks the shared customer fields; `fields` is null when something is wrong. */
function readCustomerForm(formData: FormData) {
  const read = (name: string) => String(formData.get(name) ?? "").trim();
  const values = {
    name: read("name"),
    phone: read("phone"),
    email: read("email"),
    instagram: read("instagram"),
    comment: read("comment"),
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
  if (values.comment.length > 2000) {
    errors.comment = "Առավելագույնը 2000 նիշ";
  }

  const fields =
    Object.keys(errors).length > 0
      ? null
      : {
          name: values.name,
          phone,
          email: values.email || null,
          social_handle: instagram,
        };
  return { values, errors, fields };
}

/** CRM: add a customer by hand, e.g. someone who bought before Numa. */
export async function createCustomer(
  _prev: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const supabase = await createAuthClient();
  const tenant = await requirePermission("customers");
  const { values, errors, fields } = readCustomerForm(formData);
  if (!(await isCurrentUserPro())) {
    return { ok: false, values, errors: {}, formError: "CRM-ը հասանելի է Pro փաթեթով։" };
  }
  if (!fields) return { ok: false, values, errors, formError: null };

  const { error } = await supabase.from("customers").insert({
    ...fields,
    tenant_id: tenant.id,
    comment: values.comment || null,
  });

  if (error?.code === "23505") {
    const { data: existing } = await supabase
      .from("customers")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("phone", fields.phone)
      .maybeSingle();
    return {
      ok: false,
      values,
      errors: { phone: "Այս համարով հաճախորդ արդեն կա" },
      formError: null,
      existingId: existing?.id,
    };
  }
  if (error) {
    console.error("creating customer failed:", error);
    return { ok: false, values, errors: {}, formError: "Չհաջողվեց պահպանել։ Փորձեք կրկին։" };
  }

  revalidatePath("/customers", "layout");
  return { ok: true, values: {}, errors: {}, formError: null };
}

export async function updateCustomer(
  customerId: string,
  _prev: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const supabase = await createAuthClient();
  const tenant = await requirePermission("customers");
  const { values, errors, fields } = readCustomerForm(formData);
  if (!fields) return { ok: false, values, errors, formError: null };

  const { data, error } = await supabase
    .from("customers")
    .update(fields)
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
  const supabase = await createAuthClient();
  const tenant = await requirePermission("customers");
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

export type CustomerOption = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  comment: string | null;
  /** Delivery address from the customer's latest order that has one. */
  lastAddress: string | null;
};

/**
 * Customers matching a name or phone, for picking one in the new-order form.
 * An empty search lists the newest customers.
 */
export async function searchCustomers(term: string): Promise<CustomerOption[]> {
  const supabase = await createAuthClient();
  const tenant = await requirePermission("customers", "orders");
  const text = term.trim().replace(/["\\%_,()]/g, "").slice(0, 60);
  const digits = text.replace(/\D/g, "");

  let query = supabase
    .from("customers")
    .select("id, name, phone, email, comment")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false })
    .limit(8);
  if (text) {
    const conditions = [`name.ilike."%${text}%"`];
    // "091 12 34 56" should find "+37491123456": the leading 0 is dropped.
    const core = digits.replace(/^0+/, "");
    if (core.length >= 3) conditions.push(`phone.ilike."%${core}%"`);
    query = query.or(conditions.join(","));
  }
  const { data, error } = await query;
  if (error) {
    console.error("searching customers failed:", error);
    return [];
  }
  if (data.length === 0) return [];

  const { data: orders } = await supabase
    .from("orders")
    .select("customer_id, metadata")
    .eq("tenant_id", tenant.id)
    .in(
      "customer_id",
      data.map((row) => row.id),
    )
    .not("metadata->>delivery_address", "is", null)
    .order("created_at", { ascending: false });
  const addresses = new Map<string, string>();
  for (const order of orders ?? []) {
    const address = (order.metadata as Record<string, unknown>)?.delivery_address;
    if (typeof address === "string" && !addresses.has(order.customer_id))
      addresses.set(order.customer_id, address);
  }

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    comment: row.comment,
    lastAddress: addresses.get(row.id) ?? null,
  }));
}
