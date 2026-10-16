"use server";

import { revalidatePath } from "next/cache";
import { isOrderStatus, type OrderStatus } from "@/config/orders";
import { isPaymentMethod } from "@/config/payments";
import { notifyOrderStatusChange } from "./notify";
import { verifySale, type LinkSale } from "./sale-link";
import { getCheckoutProduct } from "@/lib/products/queries";
import { supabase } from "@/lib/supabase";
import { getCurrentTenant } from "@/lib/tenant/get-current-tenant";

export type OrderFormState = {
  ok: boolean;
  values: Record<string, string>;
  errors: Record<string, string>;
  formError: string | null;
};

const REQUIRED = "Պարտադիր դաշտ է";
const BAD_PHONE = "Մուտքագրեք ճիշտ հեռախոսահամար";
const NOT_ENOUGH_STOCK = "Պահեստում բավարար քանակ չկա։";

/** Returns the normalized phone, or null if it isn't a valid number. */
function normalizePhone(raw: string): string | null {
  const phone = raw.replace(/[\s\-()]/g, "");
  return /^\+?\d{8,15}$/.test(phone) ? phone : null;
}

function parseQty(raw: string): number | null {
  const qty = Number(raw);
  return Number.isInteger(qty) && qty >= 1 ? qty : null;
}

function revalidateOrderPages() {
  revalidatePath("/orders");
  revalidatePath("/customers", "layout");
  revalidatePath("/inventory");
  revalidatePath("/catalog");
}

/** The order's status right now, or null if it isn't this tenant's order. */
async function currentStatus(
  tenantId: string,
  orderId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  return data?.status ?? null;
}

// ── Public checkout ──────────────────────────────────────────
export async function placeOrder(
  productId: string,
  /** From a signed sale link; ignored unless the signature is genuine. */
  sale: LinkSale | null,
  /** Id of the admin's private note from the copied link, if any. */
  linkRef: string | null,
  _prev: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const read = (name: string) => String(formData.get(name) ?? "").trim();
  const values = {
    name: read("name"),
    email: read("email"),
    phone: read("phone"),
    address: read("address"),
    qty: read("qty") || "1",
  };
  const fail = (formError: string): OrderFormState => ({
    ok: false,
    values,
    errors: {},
    formError,
  });

  const product = await getCheckoutProduct(productId);
  if (!product) return fail("Այս ապրանքն այլևս հասանելի չէ։");
  const needsAddress = product.businessType === "ecommerce";

  const errors: Record<string, string> = {};
  if (!values.name) errors.name = REQUIRED;

  const phone = normalizePhone(values.phone);
  if (!values.phone) errors.phone = REQUIRED;
  else if (!phone) errors.phone = BAD_PHONE;

  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Մուտքագրեք ճիշտ էլ. հասցե";
  }
  if (needsAddress && !values.address) errors.address = REQUIRED;

  const qty = parseQty(values.qty);
  if (!qty) errors.qty = "Մուտքագրեք 1 կամ ավելի";
  else if (product.stock !== null && qty > product.stock) {
    errors.qty = "Այդ քանակն առկա չէ։ Ընտրեք ավելի քիչ։";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, values, errors, formError: null };
  }

  // Unit price, delivery fee, tenant and stock are resolved inside place_order.
  const terms = verifySale(productId, sale);
  const { data: orderId, error } = await supabase.rpc("place_order", {
    p_product_id: productId,
    p_name: values.name,
    p_email: values.email,
    p_phone: phone,
    p_address: needsAddress ? values.address : "",
    p_qty: qty,
    p_discount_percent: terms?.percent ?? 0,
  });

  if (error) {
    if (error.message.includes("out_of_stock")) {
      return fail("Ցավոք, այդ քանակն այլևս առկա չէ։ Թարմացրեք էջը։");
    }
    if (error.message.includes("product_not_found")) {
      return fail("Այս ապրանքն այլևս հասանելի չէ։");
    }
    console.error(
      "place_order failed:",
      error.code,
      error.message,
      error.details,
    );
    return fail("Չհաջողվեց ուղարկել պատվերը։ Փորձեք կրկին։");
  }

  // A signed link can set its own delivery fee (e.g. free delivery).
  if (terms && terms.delivery !== null && orderId) {
    const { error: deliveryError } = await supabase
      .from("orders")
      .update({ delivery_fee: terms.delivery })
      .eq("id", orderId);
    if (deliveryError)
      console.error("setting link delivery fee failed:", deliveryError);
  }

  // The admin's private note from the link becomes the order's comment.
  if (linkRef && orderId) {
    const { data: link } = await supabase
      .from("checkout_link_notes")
      .select("note")
      .eq("id", linkRef)
      .eq("product_id", productId)
      .maybeSingle();
    if (link?.note) {
      const { data: order } = await supabase
        .from("orders")
        .select("metadata")
        .eq("id", orderId)
        .maybeSingle();
      const metadata = {
        ...((order?.metadata ?? {}) as Record<string, unknown>),
        note: link.note,
      };
      const { error: noteError } = await supabase
        .from("orders")
        .update({ metadata })
        .eq("id", orderId);
      if (noteError) console.error("saving link note on order failed:", noteError);
    }
  }

  revalidateOrderPages();
  return { ok: true, values: {}, errors: {}, formError: null };
}

// ── Admin edit ───────────────────────────────────────────────
export async function updateOrder(
  orderId: string,
  _prev: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const tenant = await getCurrentTenant();
  const read = (name: string) => String(formData.get(name) ?? "").trim();
  const values = {
    phone: read("phone"),
    address: read("address"),
    qty: read("qty"),
    discount_percent: read("discount_percent"),
    discount_amount: read("discount_amount"),
    delivery_fee: read("delivery_fee"),
    status: read("status"),
  };
  const fail = (formError: string): OrderFormState => ({
    ok: false,
    values,
    errors: {},
    formError,
  });

  const errors: Record<string, string> = {};
  const amount = (
    name: "discount_percent" | "discount_amount" | "delivery_fee",
  ) => {
    const number = values[name] === "" ? 0 : Number(values[name]);
    if (!Number.isFinite(number) || number < 0) {
      errors[name] = "Մուտքագրեք 0 կամ ավելի";
      return 0;
    }
    return number;
  };

  const phone = normalizePhone(values.phone);
  if (!values.phone) errors.phone = REQUIRED;
  else if (!phone) errors.phone = BAD_PHONE;

  const qty = parseQty(values.qty);
  if (!qty) errors.qty = "Մուտքագրեք 1 կամ ավելի";

  const discountPercent = amount("discount_percent");
  if (discountPercent > 100) errors.discount_percent = "Առավելագույնը 100%";
  const discountAmount = amount("discount_amount");
  const deliveryFee = amount("delivery_fee");

  if (!isOrderStatus(values.status)) errors.status = REQUIRED;

  if (Object.keys(errors).length > 0) {
    return { ok: false, values, errors, formError: null };
  }

  const previousStatus = await currentStatus(tenant.id, orderId);

  // Totals are recalculated by the database; stock moves by the qty difference.
  const { error } = await supabase.rpc("update_order", {
    p_order_id: orderId,
    p_tenant_id: tenant.id,
    p_phone: phone,
    p_address: values.address,
    p_qty: qty,
    p_discount_percent: discountPercent,
    p_discount_amount: discountAmount,
    p_delivery_fee: deliveryFee,
    p_status: values.status,
  });

  if (error) {
    if (error.message.includes("out_of_stock")) return fail(NOT_ENOUGH_STOCK);
    if (error.message.includes("phone_taken")) {
      return {
        ok: false,
        values,
        errors: { phone: "Այս համարով այլ հաճախորդ արդեն կա" },
        formError: null,
      };
    }
    if (error.message.includes("order_not_found")) {
      return fail("Պատվերը չի գտնվել։ Թարմացրեք էջը։");
    }
    if (error.code === "23514") {
      return {
        ok: false,
        values,
        errors: {
          discount_amount: "Զեղչը չի կարող գերազանցել ապրանքի գումարը",
        },
        formError: null,
      };
    }
    console.error("update_order failed:", error);
    return fail("Չհաջողվեց պահպանել։ Փորձեք կրկին։");
  }

  if (previousStatus !== null && previousStatus !== values.status) {
    // Awaited on purpose: background sending did not run reliably on the host.
    await notifyOrderStatusChange(
      tenant,
      orderId,
      values.status as OrderStatus,
    );
  }

  revalidateOrderPages();
  return { ok: true, values: {}, errors: {}, formError: null };
}

// ── Admin: change only the status, straight from the table ───
export async function updateOrderStatus(
  orderId: string,
  status: string,
): Promise<{ ok: boolean; error: string | null }> {
  const tenant = await getCurrentTenant();
  if (!isOrderStatus(status)) return { ok: false, error: "Անհայտ կարգավիճակ" };

  const previousStatus = await currentStatus(tenant.id, orderId);

  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .eq("tenant_id", tenant.id)
    .select("id");

  if (error || data.length === 0) {
    if (error) console.error("updating order status failed:", error);
    return { ok: false, error: "Չհաջողվեց փոխել կարգավիճակը։ Փորձեք կրկին։" };
  }

  if (previousStatus !== status) {
    // Awaited on purpose: background sending did not run reliably on the host.
    await notifyOrderStatusChange(tenant, orderId, status);
  }

  revalidatePath("/orders");
  revalidatePath("/customers", "layout");
  return { ok: true, error: null };
}

// ── Admin: add an order by hand (phone call, Instagram DM, ...) ──
export async function createManualOrder(
  _prev: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const tenant = await getCurrentTenant();
  const isShop = tenant.businessType === "ecommerce";
  const read = (name: string) => String(formData.get(name) ?? "").trim();
  const values = {
    product_id: read("product_id"),
    qty: read("qty") || "1",
    name: read("name"),
    phone: read("phone"),
    email: read("email"),
    address: read("address"),
    source: read("source"),
    discount_percent: read("discount_percent"),
    payment_method: read("payment_method"),
    paid: read("paid"),
  };
  const fail = (formError: string): OrderFormState => ({
    ok: false,
    values,
    errors: {},
    formError,
  });

  const errors: Record<string, string> = {};
  if (!values.product_id) errors.product_id = REQUIRED;
  if (!values.name) errors.name = REQUIRED;

  const phone = normalizePhone(values.phone);
  if (!values.phone) errors.phone = REQUIRED;
  else if (!phone) errors.phone = BAD_PHONE;

  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Մուտքագրեք ճիշտ էլ. հասցե";
  }

  const qty = parseQty(values.qty);
  if (!qty) errors.qty = "Մուտքագրեք 1 կամ ավելի";

  const discountPercent =
    values.discount_percent === "" ? 0 : Number(values.discount_percent);
  if (
    !Number.isFinite(discountPercent) ||
    discountPercent < 0 ||
    discountPercent > 100
  ) {
    errors.discount_percent = "Մուտքագրեք 0-ից 100";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, values, errors, formError: null };
  }

  // The product must belong to this tenant; place_order itself only takes an id.
  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("id", values.product_id)
    .eq("tenant_id", tenant.id)
    .eq("is_active", true)
    .maybeSingle();
  if (!product) {
    return {
      ok: false,
      values,
      errors: { product_id: "Ընտրեք ապրանքը ցանկից" },
      formError: null,
    };
  }

  // Same path as the public checkout: price and delivery fee come from the
  // product, stock is reserved, and the customer is matched by phone.
  const { data: orderId, error } = await supabase.rpc("place_order", {
    p_product_id: product.id,
    p_name: values.name,
    p_email: values.email,
    p_phone: phone,
    p_address: isShop ? values.address : "",
    p_qty: qty,
    p_discount_percent: discountPercent,
  });

  if (error) {
    if (error.message.includes("out_of_stock")) return fail(NOT_ENOUGH_STOCK);
    console.error("place_order (manual) failed:", error);
    return fail("Չհաջողվեց պահպանել։ Փորձեք կրկին։");
  }

  // Payment details live in metadata next to the address.
  if (isPaymentMethod(values.payment_method) || values.paid) {
    await mergeOrderMetadata(tenant.id, orderId, {
      payment_method: isPaymentMethod(values.payment_method)
        ? values.payment_method
        : null,
      paid: values.paid === "yes",
    });
  }

  if (values.source) {
    const { data: option } = await supabase
      .from("order_sources")
      .select("name")
      .eq("tenant_id", tenant.id)
      .eq("name", values.source)
      .maybeSingle();
    if (option) {
      const { error: sourceError } = await supabase
        .from("orders")
        .update({ source: option.name })
        .eq("id", orderId)
        .eq("tenant_id", tenant.id);
      if (sourceError)
        console.error("setting order source failed:", sourceError);
    }
  }

  revalidateOrderPages();
  return { ok: true, values: {}, errors: {}, formError: null };
}

// ── Admin: delete an order ───────────────────────────────────
export async function deleteOrder(
  orderId: string,
  /** Put the order's quantity back into stock. */
  restock: boolean,
): Promise<{ ok: boolean; error: string | null }> {
  const tenant = await getCurrentTenant();

  const { data, error } = await supabase
    .from("orders")
    .delete()
    .eq("id", orderId)
    .eq("tenant_id", tenant.id)
    .select("product_id, qty");

  if (error || data.length === 0) {
    if (error) console.error("deleting order failed:", error);
    return { ok: false, error: "Չհաջողվեց ջնջել։ Փորձեք կրկին։" };
  }

  revalidateOrderPages();
  revalidatePath("/dashboard");

  if (restock) {
    const { product_id, qty } = data[0];
    // Products without stock tracking (services) have nothing to return.
    const { error: stockError } = await supabase.rpc("adjust_stock", {
      p_tenant_id: tenant.id,
      p_product_id: product_id,
      p_received: qty,
      p_gifted: 0,
    });
    // Packaging and other materials go back too.
    const { error: materialError } = await supabase.rpc("consume_materials", {
      p_product_id: product_id,
      p_qty: -qty,
    });
    if (materialError)
      console.error("returning materials failed:", materialError);
    if (stockError && !stockError.message.includes("product_not_found")) {
      console.error("restocking after order delete failed:", stockError);
      return {
        ok: false,
        error:
          "Պատվերը ջնջվեց, բայց քանակը չվերադարձվեց պահեստ։ Ուղղեք այն «Պահեստ» բաժնում։",
      };
    }
  }

  return { ok: true, error: null };
}

// ── Admin: a free-text comment on an order ───────────────────
export async function updateOrderComment(
  orderId: string,
  comment: string,
): Promise<{ ok: boolean; error: string | null }> {
  const tenant = await getCurrentTenant();
  const text = comment.trim();
  if (text.length > 2000) {
    return {
      ok: false,
      error: "Մեկնաբանությունը չափազանց երկար է (առավելագույնը 2000 նիշ)",
    };
  }
  const failed = { ok: false, error: "Չհաջողվեց պահպանել։ Փորձեք կրկին։" };

  const { data: order } = await supabase
    .from("orders")
    .select("metadata")
    .eq("id", orderId)
    .eq("tenant_id", tenant.id)
    .maybeSingle();
  if (!order) return failed;

  // The comment lives in metadata next to the address; keep everything else.
  const metadata = { ...((order.metadata ?? {}) as Record<string, unknown>) };
  if (text) metadata.note = text;
  else delete metadata.note;

  const { error } = await supabase
    .from("orders")
    .update({ metadata })
    .eq("id", orderId)
    .eq("tenant_id", tenant.id);
  if (error) {
    console.error("updating order comment failed:", error);
    return failed;
  }

  revalidatePath("/orders");
  revalidatePath("/customers", "layout");
  return { ok: true, error: null };
}

/** Sets keys in an order's metadata (null removes a key); keeps the rest. */
async function mergeOrderMetadata(
  tenantId: string,
  orderId: string,
  changes: Record<string, unknown>,
): Promise<boolean> {
  const { data: order } = await supabase
    .from("orders")
    .select("metadata")
    .eq("id", orderId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (!order) return false;

  const metadata = { ...((order.metadata ?? {}) as Record<string, unknown>) };
  for (const [key, value] of Object.entries(changes)) {
    if (value === null) delete metadata[key];
    else metadata[key] = value;
  }
  const { error } = await supabase
    .from("orders")
    .update({ metadata })
    .eq("id", orderId)
    .eq("tenant_id", tenantId);
  if (error) console.error("updating order metadata failed:", error);
  return !error;
}

// ── Admin: payment method and paid / unpaid, straight from the table ──
export async function updateOrderPayment(
  orderId: string,
  change: { method?: string | null; paid?: boolean },
): Promise<{ ok: boolean; error: string | null }> {
  const tenant = await getCurrentTenant();
  const changes: Record<string, unknown> = {};
  if (change.method !== undefined) {
    if (change.method !== null && !isPaymentMethod(change.method)) {
      return { ok: false, error: "Անհայտ վճարման եղանակ" };
    }
    changes.payment_method = change.method;
  }
  if (change.paid !== undefined) changes.paid = change.paid;

  const ok = await mergeOrderMetadata(tenant.id, orderId, changes);
  if (!ok) return { ok: false, error: "Չհաջողվեց պահպանել։ Փորձեք կրկին։" };

  revalidatePath("/orders");
  revalidatePath("/customers", "layout");
  return { ok: true, error: null };
}
