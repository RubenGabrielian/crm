import type { BusinessType } from "@/lib/tenant/features";

export const ORDER_STATUSES = ["new", "confirmed", "completed"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<BusinessType, Record<OrderStatus, string>> = {
  ecommerce: { new: "Նոր", confirmed: "Հաստատված", completed: "Առաքված" },
  service: { new: "Նոր", confirmed: "Հաստատված", completed: "Ավարտված" },
};

export function isOrderStatus(value: unknown): value is OrderStatus {
  return ORDER_STATUSES.includes(value as OrderStatus);
}
