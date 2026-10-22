import { isPaymentMethod, type PaymentMethod } from "@/config/payments";
import type { BusinessType } from "@/lib/tenant/features";

/** A preorder holds no stock until it moves on to "confirmed" or "completed". */
export const ORDER_STATUSES = ["new", "preorder", "confirmed", "completed"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<BusinessType, Record<OrderStatus, string>> = {
  ecommerce: { new: "Նոր", preorder: "Նախապատվեր", confirmed: "Հաստատված", completed: "Առաքված" },
  service: { new: "Նոր", preorder: "Նախապատվեր", confirmed: "Հաստատված", completed: "Ավարտված" },
  mixed: { new: "Նոր", preorder: "Նախապատվեր", confirmed: "Հաստատված", completed: "Ավարտված" },
};

export function isOrderStatus(value: unknown): value is OrderStatus {
  return ORDER_STATUSES.includes(value as OrderStatus);
}

/** Fields the orders page can be searched by; "all" looks in every one. */
export const ORDER_SEARCH_FIELDS = [
  "all",
  "customer",
  "phone",
  "email",
  "product",
  "order",
  "address",
  "comment",
  "source",
] as const;
export type OrderSearchField = (typeof ORDER_SEARCH_FIELDS)[number];

export function isOrderSearchField(value: unknown): value is OrderSearchField {
  return ORDER_SEARCH_FIELDS.includes(value as OrderSearchField);
}

/** Order filters, kept in the URL next to the search (?status=…&paid=…). */
export type OrderFilters = {
  status?: OrderStatus;
  paid?: "yes" | "no";
  payment?: PaymentMethod;
  /** A source name, or NO_SOURCE for orders without one. */
  source?: string;
  product?: string;
  /** Yerevan calendar days, YYYY-MM-DD, both inclusive. */
  from?: string;
  to?: string;
};
export const ORDER_FILTER_KEYS = [
  "status",
  "paid",
  "payment",
  "source",
  "product",
  "from",
  "to",
] as const satisfies readonly (keyof OrderFilters)[];

/** The "no source" choice of the source filter. */
export const NO_SOURCE = "-";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Reads the filters from the page's search params; unknown values are dropped. */
export function parseOrderFilters(
  query: Record<string, string | string[] | undefined>,
): OrderFilters {
  const pick = (key: string) => {
    const value = query[key];
    const text = Array.isArray(value) ? value[0] : value;
    return text?.trim() || undefined;
  };
  const filters: OrderFilters = {};
  const status = pick("status");
  if (isOrderStatus(status)) filters.status = status;
  const paid = pick("paid");
  if (paid === "yes" || paid === "no") filters.paid = paid;
  const payment = pick("payment");
  if (isPaymentMethod(payment)) filters.payment = payment;
  const source = pick("source");
  if (source && source.length <= 100) filters.source = source;
  const product = pick("product");
  if (product && UUID.test(product)) filters.product = product;
  const from = pick("from");
  if (from && DAY.test(from)) filters.from = from;
  const to = pick("to");
  if (to && DAY.test(to)) filters.to = to;
  return filters;
}
