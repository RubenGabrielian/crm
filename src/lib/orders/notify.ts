import "server-only";

import { ORDER_STATUS_LABELS, type OrderStatus } from "@/config/orders";
import { emailConfigured, escapeHtml, sendEmail } from "@/lib/email/send";
import { supabase } from "@/lib/supabase";
import type { Tenant } from "@/lib/tenant/features";

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

/**
 * Tells the customer by email that their order has a new status.
 * Does nothing when the customer has no email. Never throws: a failed
 * email must not undo or block the status change itself.
 */
export async function notifyOrderStatusChange(
  tenant: Tenant,
  orderId: string,
  status: OrderStatus,
): Promise<void> {
  try {
    await sendStatusEmail(tenant, orderId, status);
  } catch (cause) {
    console.error("order status email crashed:", cause);
  }
}

async function sendStatusEmail(
  tenant: Tenant,
  orderId: string,
  status: OrderStatus,
) {
  const shortId = `#${orderId.slice(0, 8).toUpperCase()}`;
  if (!emailConfigured) {
    console.warn(
      `order status email skipped for ${shortId}: RESEND_API_KEY is not set`,
    );
    return;
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select("id, qty, customers(name, email), products(title)")
    .eq("id", orderId)
    .eq("tenant_id", tenant.id)
    .maybeSingle();
  if (error || !order) {
    if (error) console.error("loading order for notification failed:", error);
    return;
  }

  const customer = one(order.customers);
  if (!customer?.email) {
    console.log(
      `order status email skipped for ${shortId}: customer has no email`,
    );
    return;
  }

  const isShop = tenant.businessType === "ecommerce";
  const statusLabel = ORDER_STATUS_LABELS[tenant.businessType][status];
  const orderWord = isShop ? "պատվերի" : "գրանցման";
  const product = one(order.products)?.title ?? "";
  const item = product
    ? `«${product}»${order.qty > 1 ? ` × ${order.qty}` : ""}`
    : shortId;

  const greeting = `Բարև, ${customer.name}։`;
  const line = `Ձեր ${item} ${orderWord} կարգավիճակը փոխվել է։`;
  const footer = `${isShop ? "Պատվեր" : "Գրանցում"} ${shortId} · ${tenant.name}`;

  const result = await sendEmail({
    to: customer.email,
    fromName: tenant.name,
    subject: `Ձեր ${orderWord} կարգավիճակը՝ ${statusLabel}`,
    text: `${greeting}\n\n${line}\nՆոր կարգավիճակ՝ ${statusLabel}\n\n${footer}`,
    html: `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1f1729">
  <p style="margin:0 0 12px;font-size:16px">${escapeHtml(greeting)}</p>
  <p style="margin:0 0 16px;font-size:16px">${escapeHtml(line)}</p>
  <p style="margin:0 0 6px;font-size:13px;color:#6f6780">Նոր կարգավիճակ</p>
  <p style="margin:0 0 24px;font-size:24px;font-weight:700">${escapeHtml(statusLabel)}</p>
  <p style="margin:0;padding-top:16px;border-top:1px solid #e7e3ee;font-size:13px;color:#6f6780">${escapeHtml(footer)}</p>
</div>`,
  });

  if (result.ok)
    console.log(`order status email sent for ${shortId} (${status})`);
  else console.error(`order status email failed for ${shortId}:`, result.error);
}
