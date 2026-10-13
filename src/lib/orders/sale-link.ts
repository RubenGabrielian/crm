import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/** A sale that came from a signed checkout link. */
export type LinkSale = { percent: number; sig: string };

// Sale links are signed, so a customer cannot change the percent in the URL.
function secret(): string | null {
  return process.env.CHECKOUT_LINK_SECRET || process.env.SUPABASE_SECRET_KEY || null;
}

export function isSalePercent(percent: number): boolean {
  return Number.isInteger(percent) && percent >= 1 && percent <= 100;
}

/** Null when the server has no signing secret configured. */
export function signSale(productId: string, percent: number): string | null {
  const key = secret();
  if (!key) return null;
  return createHmac("sha256", key)
    .update(`${productId}:${percent}`)
    .digest("base64url")
    .slice(0, 22);
}

/** The percent if the link is genuine for this product, otherwise 0. */
export function verifySale(productId: string, sale: LinkSale | null): number {
  if (!sale || !isSalePercent(sale.percent)) return 0;
  const expected = signSale(productId, sale.percent);
  if (!expected) return 0;
  const a = Buffer.from(expected);
  const b = Buffer.from(String(sale.sig));
  return a.length === b.length && timingSafeEqual(a, b) ? sale.percent : 0;
}
