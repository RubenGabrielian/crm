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
