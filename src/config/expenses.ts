export const EXPENSE_CATEGORIES = [
  "paid_ads",
  "influencer",
  "marketing",
  "materials",
  "packaging",
  "rent",
  "other",
  "personal",
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
  personal: "Անձնական ծախսեր",
};

export function isExpenseCategory(value: unknown): value is ExpenseCategory {
  return EXPENSE_CATEGORIES.includes(value as ExpenseCategory);
}

/** Label for a stored category; unknown values are shown as they are. */
export function expenseCategoryLabel(value: string) {
  return isExpenseCategory(value) ? EXPENSE_CATEGORY_LABELS[value] : value;
}

/** Categories counted as marketing spend (for CAC and ROAS). */
export const MARKETING_CATEGORIES: readonly string[] = [
  "paid_ads",
  "influencer",
  "marketing",
];

/** The owner's personal spending: shown apart from business expenses. */
export const PERSONAL_CATEGORY = "personal";

export type ExpenseGroup = "marketing" | "other" | "personal";

export function expenseGroup(category: string): ExpenseGroup {
  if (MARKETING_CATEGORIES.includes(category)) return "marketing";
  return category === PERSONAL_CATEGORY ? "personal" : "other";
}

/** Fixed: paid whatever the sales (marketing budget, rent). Variable: grows with sales. */
export const COST_TYPES = ["fixed", "variable"] as const;
export type CostType = (typeof COST_TYPES)[number];

export const COST_TYPE_LABELS: Record<CostType, string> = {
  fixed: "Ֆիքսված",
  variable: "Փոփոխական",
};

export function isCostType(value: unknown): value is CostType {
  return COST_TYPES.includes(value as CostType);
}

/** Suggested type when a category is picked; the admin can change it. */
export function defaultCostType(category: string): CostType {
  return category === "materials" || category === "packaging"
    ? "variable"
    : "fixed";
}
