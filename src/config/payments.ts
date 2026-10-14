export const PAYMENT_METHODS = [
  "cash",
  "card",
  "transfer",
  "post",
  "other",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Կանխիկ",
  card: "Քարտով",
  transfer: "Փոխանցում",
  post: "POS",
  other: "Այլ",
};

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return PAYMENT_METHODS.includes(value as PaymentMethod);
}

/** Stored value → method; also understands the names used in imported sheets. */
export function toPaymentMethod(value: unknown): PaymentMethod | null {
  if (isPaymentMethod(value)) return value;
  const text = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!text) return null;
  if (text === "cash") return "cash";
  if (text === "bank transfer") return "transfer";
  if (["card", "idram", "telcell"].includes(text)) return "card";
  return "other";
}
