export const EXPENSE_CATEGORIES = [
  "paid_ads",
  "influencer",
  "marketing",
  "materials",
  "packaging",
  "rent",
  "other",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  paid_ads: "Վճարովի գովազդ",
  influencer: "Ինֆլուենսեր",
  marketing: "Այլ մարքեթինգ",
  materials: "Նյութեր",
  packaging: "Փաթեթավորում",
  rent: "Վարձակալություն",
  other: "Այլ",
};

export function isExpenseCategory(value: unknown): value is ExpenseCategory {
  return EXPENSE_CATEGORIES.includes(value as ExpenseCategory);
}

/** Label for a stored category; unknown values are shown as they are. */
export function expenseCategoryLabel(value: string) {
  return isExpenseCategory(value) ? EXPENSE_CATEGORY_LABELS[value] : value;
}

/** Categories counted as marketing spend (for CAC and ROAS); the rest are operating expenses. */
export const MARKETING_CATEGORIES: readonly string[] = ["paid_ads", "influencer", "marketing"];
