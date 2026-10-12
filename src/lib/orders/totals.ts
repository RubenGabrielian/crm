function round2(value: number) {
  return Math.round(value * 100) / 100;
}

/**
 * Same rules as the database: a percent discount above 0 takes priority and
 * the discount amount is calculated from it; otherwise the raw amount is used.
 */
export function computeOrderTotals(input: {
  qty: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  deliveryFee: number;
}) {
  const subtotal = round2(input.qty * input.unitPrice);
  const discount =
    input.discountPercent > 0
      ? round2((subtotal * input.discountPercent) / 100)
      : input.discountAmount;
  const productTotal = round2(subtotal - discount);
  return {
    subtotal,
    discount,
    productTotal,
    orderTotal: round2(productTotal + input.deliveryFee),
  };
}
