import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Terms set by the admin when copying a checkout link: a sale percent and/or
 * a delivery fee. `delivery` null = the product's own delivery cost.
 */
export type LinkSale = {
  percent: number;
  delivery: number | null;
  sig: string;
};
export type LinkTerms = { percent: number; delivery: number | null };

// Links are signed, so a customer cannot change the percent or delivery fee in the URL.
function secret(): string | null {
  return (
    process.env.CHECKOUT_LINK_SECRET || process.env.SUPABASE_SECRET_KEY || null
  );
}

export function isSalePercent(percent: number): boolean {
  return Number.isInteger(percent) && percent >= 0 && percent <= 100;
}

export function isDeliveryFee(fee: number): boolean {
  return Number.isFinite(fee) && fee >= 0 && fee <= 1_000_000;
}

/** Null when the server has no signing secret configured. */
export function signSale(productId: string, terms: LinkTerms): string | null {
  const key = secret();
  if (!key) return null;
  // Sale-only links keep the original payload, so links already sent still work.
  const payload =
    terms.delivery === null
      ? `${productId}:${terms.percent}`
      : `${productId}:${terms.percent}:d${terms.delivery}`;
  return createHmac("sha256", key)
    .update(payload)
    .digest("base64url")
    .slice(0, 22);
}

/** The link's terms if it is genuine for this product, otherwise null. */
export function verifySale(
  productId: string,
  sale: LinkSale | null,
): LinkTerms | null {
  if (!sale || !isSalePercent(sale.percent)) return null;
  if (sale.delivery !== null && !isDeliveryFee(sale.delivery)) return null;
  if (sale.percent === 0 && sale.delivery === null) return null;
  const expected = signSale(productId, sale);
  if (!expected) return null;
  const a = Buffer.from(expected);
  const b = Buffer.from(String(sale.sig));
  return a.length === b.length && timingSafeEqual(a, b)
    ? { percent: sale.percent, delivery: sale.delivery }
    : null;
}

/** Reads ?sale=&delivery=&sig= from a checkout URL. */
export function readLinkSale(
  query: Record<string, string | string[] | undefined>,
): LinkSale {
  const one = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;
  const delivery = one(query.delivery);
  return {
    percent: Number(one(query.sale) ?? 0),
    delivery:
      delivery === undefined || delivery === "" ? null : Number(delivery),
    sig: String(one(query.sig) ?? ""),
  };
}
