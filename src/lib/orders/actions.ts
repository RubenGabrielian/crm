"use server";

import { revalidatePath } from "next/cache";
import {
  isOrderSearchField,
  isOrderStatus,
  parseOrderFilters,
  type OrderStatus,
} from "@/config/orders";
import { isPaymentMethod } from "@/config/payments";
import { notifyOrderStatusChange } from "./notify";
import { verifySale, type LinkSale } from "./sale-link";
import { getCheckoutProduct } from "@/lib/products/queries";
import { listOrderIds } from "./queries";
import { requireAdminClient } from "@/lib/supabase/admin";
import { createAuthClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/tenant/get-current-tenant";
import { scheduleFromInput } from "./schedule";

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
  const supabase = await createAuthClient();
  const { data } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  return data?.status ?? null;
}

// ── Public checkout ──────────────────────────────────────────
/** Shown to buyers when the seller has no Pro, which online orders need. */
const SELLER_UNAVAILABLE =
  "Առցանց պատվերն այս պահին հասանելի չէ։ Կապվեք վաճառողի հետ։";

export async function placeOrder(
  productId: string,
  /** From a signed sale link; ignored unless the signature is genuine. */
  sale: LinkSale | null,
  /** Id of the admin's private note from the copied link, if any. */
  linkRef: string | null,
  _prev: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const supabase = requireAdminClient();
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
  if (!product.sellerIsPro) return fail(SELLER_UNAVAILABLE);
  const needsAddress = product.kind === "product";

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
  const supabase = await createAuthClient();
  const tenant = await requirePermission("orders");
  const read = (name: string) => String(formData.get(name) ?? "").trim();
  const values = {
    phone: read("phone"),
    address: read("address"),
    qty: read("qty"),
    discount_percent: read("discount_percent"),
    discount_amount: read("discount_amount"),
    delivery_fee: read("delivery_fee"),
    unit_price: read("unit_price"),
    status: read("status"),
    scheduled_at: read("scheduled_at"),
  };
  const fail = (formError: string): OrderFormState => ({
    ok: false,
    values,
    errors: {},
    formError,
  });

  const errors: Record<string, string> = {};
  const amount = (
    name: "discount_percent" | "discount_amount" | "delivery_fee" | "unit_price",
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
  // Left empty, the price stays as it is.
  const unitPrice = values.unit_price === "" ? null : amount("unit_price");
  const scheduledAt = scheduleFromInput(values.scheduled_at);
  if (scheduledAt === "invalid") errors.scheduled_at = "Ընտրեք օրը և ժամը";

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
    p_unit_price: unitPrice,
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

  await mergeOrderMetadata(tenant.id, orderId, {
    scheduled_at: scheduledAt === "invalid" ? null : scheduledAt,
  });

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
  const supabase = await createAuthClient();
  const tenant = await requirePermission("orders");
  if (!isOrderStatus(status)) return { ok: false, error: "Անհայտ կարգավիճակ" };

  const previousStatus = await currentStatus(tenant.id, orderId);
  if (previousStatus === null) {
    return { ok: false, error: "Պատվերը չի գտնվել։ Թարմացրեք էջը։" };
  }

  // Into or out of "preorder", stock moves too, so the database does it.
  const { error } =
    previousStatus === "preorder" || status === "preorder"
      ? await supabase.rpc("set_order_status", {
          p_order_id: orderId,
          p_tenant_id: tenant.id,
          p_status: status,
        })
      : await supabase
          .from("orders")
          .update({ status })
          .eq("id", orderId)
          .eq("tenant_id", tenant.id);

  if (error) {
    if (error.message.includes("out_of_stock")) {
      return { ok: false, error: NOT_ENOUGH_STOCK };
    }
    console.error("updating order status failed:", error);
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
/** One line of a manual order, as sent by the form in its "lines" field. */
type OrderLineInput = { productId: string; qty: string; price: string };

function parseLines(raw: string): OrderLineInput[] {
  try {
    const list: unknown = JSON.parse(raw || "[]");
    if (!Array.isArray(list)) return [];
    return list.map((item) => ({
      productId: String(item?.productId ?? "").trim(),
      qty: String(item?.qty ?? "").trim(),
      price: String(item?.price ?? "").trim(),
    }));
  } catch {
    return [];
  }
}

/**
 * Saves every line (e.g. car glass + fitting) as its own order row for the
 * same customer, so stock, cost and profit stay per item. Rows of one visit
 * share metadata.group_id.
 */
export async function createManualOrder(
  _prev: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const supabase = await createAuthClient();
  const tenant = await requirePermission("orders");
  const takesAddress = tenant.businessType !== "service";
  const read = (name: string) => String(formData.get(name) ?? "").trim();
  const values = {
    lines: read("lines"),
    name: read("name"),
    phone: read("phone"),
    email: read("email"),
    address: read("address"),
    source: read("source"),
    discount_percent: read("discount_percent"),
    payment_method: read("payment_method"),
    paid: read("paid"),
    scheduled_at: read("scheduled_at"),
    preorder: read("preorder"),
    customer_comment: read("customer_comment"),
  };
  // The customer's comment is only written when the admin changed it here.
  const commentChanged = formData.get("customer_comment_changed") === "1";
  // A preorder takes no stock, so out-of-stock items can be ordered.
  const preorder = values.preorder === "on";
  const fail = (formError: string): OrderFormState => ({
    ok: false,
    values,
    errors: {},
    formError,
  });

  const errors: Record<string, string> = {};
  // Error keys use the row's place in the form; empty extra rows are skipped.
  const lines = parseLines(values.lines);
  if (lines.length === 0) errors["line-0-product"] = REQUIRED;
  if (!values.name) errors.name = REQUIRED;

  const phone = normalizePhone(values.phone);
  if (!values.phone) errors.phone = REQUIRED;
  else if (!phone) errors.phone = BAD_PHONE;

  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Մուտքագրեք ճիշտ էլ. հասցե";
  }
  if (values.customer_comment.length > 2000)
    errors.customer_comment = "Առավելագույնը 2000 նիշ";

  const discountPercent =
    values.discount_percent === "" ? 0 : Number(values.discount_percent);
  if (
    !Number.isFinite(discountPercent) ||
    discountPercent < 0 ||
    discountPercent > 100
  ) {
    errors.discount_percent = "Մուտքագրեք 0-ից 100";
  }

  const scheduledAt = scheduleFromInput(values.scheduled_at);
  if (scheduledAt === "invalid") errors.scheduled_at = "Ընտրեք օրը և ժամը";

  // Only this tenant's active items can be ordered.
  const ids = [...new Set(lines.map((line) => line.productId).filter(Boolean))];
  const { data: products } = ids.length
    ? await supabase
        .from("products")
        .select("id, title, price, inventory(stock_quantity)")
        .eq("tenant_id", tenant.id)
        .eq("is_active", true)
        .in("id", ids)
    : { data: [] };
  const byId = new Map((products ?? []).map((row) => [row.id, row]));

  const parsed: { productId: string; title: string; qty: number; price: number; listPrice: number }[] = [];
  const wanted = new Map<string, number>();
  lines.forEach((line, index) => {
    if (index > 0 && !line.productId) return;
    const product = byId.get(line.productId);
    if (!line.productId) errors[`line-${index}-product`] = REQUIRED;
    else if (!product) errors[`line-${index}-product`] = "Ընտրեք ցանկից";

    const qty = parseQty(line.qty || "1");
    if (!qty) errors[`line-${index}-qty`] = "1 կամ ավելի";

    const listPrice = Number(product?.price ?? 0);
    const price = line.price === "" ? listPrice : Number(line.price);
    if (!Number.isFinite(price) || price < 0)
      errors[`line-${index}-price`] = "0 կամ ավելի";

    if (product && qty) {
      wanted.set(product.id, (wanted.get(product.id) ?? 0) + qty);
      const stockRow = Array.isArray(product.inventory)
        ? product.inventory[0]
        : product.inventory;
      if (
        !preorder &&
        stockRow &&
        (wanted.get(product.id) ?? 0) > stockRow.stock_quantity
      )
        errors[`line-${index}-qty`] = `Առկա է ${stockRow.stock_quantity}`;
      parsed.push({ productId: product.id, title: product.title, qty, price, listPrice });
    }
  });

  if (Object.keys(errors).length > 0) {
    return { ok: false, values, errors, formError: null };
  }

  const groupId = parsed.length > 1 ? crypto.randomUUID() : null;
  let deliveryCharged = false;
  let firstOrderId: string | null = null;

  for (const [index, line] of parsed.entries()) {
    // Same path as the public checkout: stock and materials are taken, and
    // the customer is matched by phone. Price and delivery are set after.
    const { data: orderId, error } = await supabase.rpc("place_order", {
      p_product_id: line.productId,
      p_name: values.name,
      p_email: values.email,
      p_phone: phone,
      p_address: takesAddress ? values.address : "",
      p_qty: line.qty,
      p_discount_percent: discountPercent,
      // Sent only for preorders, so plain orders don't depend on migration 0020.
      ...(preorder ? { p_preorder: true } : {}),
    });

    if (error || !orderId) {
      if (error) console.error("place_order (manual) failed:", error);
      const reason = error?.message.includes("out_of_stock")
        ? NOT_ENOUGH_STOCK
        : "Փորձեք կրկին։";
      if (index === 0) {
        return fail(
          error?.message.includes("out_of_stock")
            ? NOT_ENOUGH_STOCK
            : "Չհաջողվեց պահպանել։ Փորձեք կրկին։",
        );
      }
      revalidateOrderPages();
      return fail(
        `Պահպանվեց ${index} դիրք, բայց «${line.title}»-ը՝ ոչ։ ${reason} Ավելացրեք այն առանձին։`,
      );
    }

    firstOrderId ??= orderId;
    const columns: Record<string, unknown> = {};
    if (line.price !== line.listPrice) {
      columns.unit_price = line.price;
      columns.discount_amount =
        Math.round(line.qty * line.price * discountPercent) / 100;
    }
    // One visit pays delivery once, on the first line that has it.
    const { data: placed } = await supabase
      .from("orders")
      .select("delivery_fee")
      .eq("id", orderId)
      .maybeSingle();
    if (Number(placed?.delivery_fee ?? 0) > 0) {
      if (deliveryCharged) columns.delivery_fee = 0;
      deliveryCharged = true;
    }
    if (values.source) {
      const { data: option } = await supabase
        .from("order_sources")
        .select("name")
        .eq("tenant_id", tenant.id)
        .eq("name", values.source)
        .maybeSingle();
      if (option) columns.source = option.name;
    }
    if (Object.keys(columns).length > 0) {
      const { error: columnsError } = await supabase
        .from("orders")
        .update(columns)
        .eq("id", orderId)
        .eq("tenant_id", tenant.id);
      if (columnsError)
        console.error("updating manual order failed:", columnsError);
    }

    await mergeOrderMetadata(tenant.id, orderId, {
      payment_method: isPaymentMethod(values.payment_method)
        ? values.payment_method
        : null,
      paid: values.paid === "yes",
      scheduled_at: scheduledAt,
      group_id: groupId,
    });
  }

  // place_order matched or created the customer by phone; note on them.
  if (commentChanged && firstOrderId) {
    const { data: placed } = await supabase
      .from("orders")
      .select("customer_id")
      .eq("id", firstOrderId)
      .maybeSingle();
    const { error: commentError } = placed
      ? await supabase
          .from("customers")
          .update({ comment: values.customer_comment || null })
          .eq("id", placed.customer_id)
          .eq("tenant_id", tenant.id)
      : { error: null };
    if (commentError) {
      console.error("saving customer comment failed:", commentError);
      revalidateOrderPages();
      return fail("Պատվերը պահպանվեց, բայց հաճախորդի մեկնաբանությունը՝ ոչ։ Ավելացրեք այն CRM-ում։");
    }
  }

  revalidateOrderPages();
  return { ok: true, values: {}, errors: {}, formError: null };
}

// ── Admin: delete an order ───────────────────────────────────
/**
 * What the delete dialog needs to know: how many other orders the customer
 * has (removing the customer is offered only at 0, so no history is lost),
 * and whether the item keeps stock (services have nothing to put back).
 */
export async function getOrderDeleteInfo(
  orderId: string,
): Promise<{ otherOrders: number; tracksStock: boolean } | null> {
  const supabase = await createAuthClient();
  const tenant = await requirePermission("orders");
  const { data: order } = await supabase
    .from("orders")
    .select("customer_id, product_id, status")
    .eq("id", orderId)
    .eq("tenant_id", tenant.id)
    .maybeSingle();
  if (!order) return null;

  const [orders, stock] = await Promise.all([
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.id)
      .eq("customer_id", order.customer_id)
      .neq("id", orderId),
    supabase
      .from("inventory")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.id)
      .eq("product_id", order.product_id),
  ]);
  if (orders.error || stock.error) {
    console.error("loading order delete info failed:", orders.error ?? stock.error);
    return null;
  }
  // A preorder took no stock, so there is nothing to put back.
  return {
    otherOrders: orders.count ?? 0,
    tracksStock: order.status !== "preorder" && (stock.count ?? 0) > 0,
  };
}

export async function deleteOrder(
  orderId: string,
  /** Put the order's quantity back into stock. */
  restock: boolean,
  /** Remove the customer from CRM too, if this was their only order. */
  deleteCustomer = false,
): Promise<{ ok: boolean; error: string | null }> {
  const supabase = await createAuthClient();
  const tenant = await requirePermission("orders");

  const { data, error } = await supabase
    .from("orders")
    .delete()
    .eq("id", orderId)
    .eq("tenant_id", tenant.id)
    .select("product_id, qty, customer_id, status");

  if (error || data.length === 0) {
    if (error) console.error("deleting order failed:", error);
    return { ok: false, error: "Չհաջողվեց ջնջել։ Փորձեք կրկին։" };
  }

  revalidateOrderPages();
  revalidatePath("/dashboard");

  // A preorder took no stock, so there is nothing to put back.
  if (restock && data[0].status !== "preorder") {
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

  // After the stock, so a problem with the customer never skips the restock.
  if (deleteCustomer) {
    const customerError = await deleteCustomerWithoutOrders(
      tenant.id,
      data[0].customer_id,
    );
    if (customerError) return { ok: false, error: customerError };
  }

  return { ok: true, error: null };
}

/**
 * Ids of every order the list shows for this search and these filters, on all
 * pages: what "select all" picks. `params` are the page's URL parameters.
 */
export async function selectAllOrderIds(
  params: Record<string, string | undefined>,
): Promise<{ ids: string[]; error: string | null }> {
  const tenant = await requirePermission("orders");
  const term = params.q?.trim() ?? "";
  const by = isOrderSearchField(params.by) ? params.by : "all";
  const { ids, error } = await listOrderIds(tenant.id, {
    search: term ? { by, term } : undefined,
    filters: parseOrderFilters(params),
  });
  if (error) {
    console.error("listing order ids failed:", error);
    return { ids: [], error: "Չհաջողվեց ընտրել։ Փորձեք կրկին։" };
  }
  return { ids, error: null };
}

// Ids per query: keeps the request URL short enough for thousands of orders.
const DELETE_CHUNK = 100;

/**
 * Deletes several orders at once. With `restock`, their quantities (and the
 * materials they used) go back to stock, summed per product. Customers stay.
 */
export async function deleteOrders(
  orderIds: string[],
  restock: boolean,
): Promise<{ ok: boolean; error: string | null }> {
  const supabase = await createAuthClient();
  const tenant = await requirePermission("orders");
  const ids = [...new Set(orderIds.map(String))].filter(Boolean);
  if (ids.length === 0) return { ok: true, error: null };

  const returned = new Map<string, number>();
  let failed = 0;
  for (let start = 0; start < ids.length; start += DELETE_CHUNK) {
    const chunk = ids.slice(start, start + DELETE_CHUNK);
    const { data, error } = await supabase
      .from("orders")
      .delete()
      .in("id", chunk)
      .eq("tenant_id", tenant.id)
      .select("product_id, qty, status");
    if (error) {
      console.error("deleting orders failed:", error);
      failed += chunk.length;
      continue;
    }
    // A preorder took no stock, so there is nothing to put back.
    for (const row of data) {
      if (row.status === "preorder") continue;
      returned.set(row.product_id, (returned.get(row.product_id) ?? 0) + row.qty);
    }
  }

  revalidateOrderPages();
  revalidatePath("/dashboard");

  let stockFailed = false;
  if (restock) {
    for (const [productId, qty] of returned) {
      // Products without stock tracking (services) have nothing to return.
      const { error: stockError } = await supabase.rpc("adjust_stock", {
        p_tenant_id: tenant.id,
        p_product_id: productId,
        p_received: qty,
        p_gifted: 0,
      });
      const { error: materialError } = await supabase.rpc("consume_materials", {
        p_product_id: productId,
        p_qty: -qty,
      });
      if (materialError)
        console.error("returning materials failed:", materialError);
      if (stockError && !stockError.message.includes("product_not_found")) {
        console.error("restocking after orders delete failed:", stockError);
        stockFailed = true;
      }
    }
  }

  if (failed > 0) {
    return {
      ok: false,
      error:
        failed === ids.length
          ? "Չհաջողվեց ջնջել։ Փորձեք կրկին։"
          : `${failed} հատը չհաջողվեց ջնջել։ Փորձեք կրկին։`,
    };
  }
  if (stockFailed) {
    return {
      ok: false,
      error:
        "Ջնջվեցին, բայց քանակի մի մասը չվերադարձվեց պահեստ։ Ուղղեք այն «Պահեստ» բաժնում։",
    };
  }
  return { ok: true, error: null };
}

/** Deletes a customer who has no orders left; returns an error message or null. */
async function deleteCustomerWithoutOrders(
  tenantId: string,
  customerId: string,
): Promise<string | null> {
  const supabase = await createAuthClient();
  // Checked again here: an order may have arrived since the dialog opened.
  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("customer_id", customerId);
  if ((count ?? 0) > 0) {
    return "Պատվերը ջնջվեց, բայց հաճախորդն ունի այլ պատվերներ, դրա համար մնաց CRM-ում։";
  }

  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", customerId)
    .eq("tenant_id", tenantId);
  if (error) {
    console.error("deleting customer failed:", error);
    return "Պատվերը ջնջվեց, բայց հաճախորդին չհաջողվեց ջնջել։ Ջնջեք նրան CRM-ից։";
  }
  return null;
}

// ── Admin: a free-text comment on an order ───────────────────
export async function updateOrderComment(
  orderId: string,
  comment: string,
): Promise<{ ok: boolean; error: string | null }> {
  const supabase = await createAuthClient();
  const tenant = await requirePermission("orders");
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
  const supabase = await createAuthClient();
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
  const tenant = await requirePermission("orders");
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
