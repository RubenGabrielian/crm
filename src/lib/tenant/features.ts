export const BUSINESS_TYPES = ["ecommerce", "service", "mixed"] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

export type Tenant = {
  id: string;
  name: string;
  businessType: BusinessType;
};

export type Feature = "inventory" | "shipping" | "capacity";

export const FEATURES = {
  ecommerce: { inventory: true, shipping: true, capacity: false },
  service: { inventory: false, shipping: false, capacity: true },
  // Sells goods and services side by side, e.g. car glass plus fitting.
  mixed: { inventory: true, shipping: true, capacity: false },
} as const satisfies Record<BusinessType, Record<Feature, boolean>>;

export function hasFeature(type: BusinessType, feature: Feature): boolean {
  return FEATURES[type][feature];
}

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  ecommerce: "Առցանց խանութ",
  service: "Ծառայություններ",
  mixed: "Ապրանքներ և ծառայություններ",
};

export function isBusinessType(value: unknown): value is BusinessType {
  return BUSINESS_TYPES.includes(value as BusinessType);
}

/**
 * Whether orders are called bookings ("գրանցում") rather than orders
 * ("պատվեր"). Only course-style service businesses use bookings.
 */
export function usesBookings(type: BusinessType): boolean {
  return type === "service";
}

/** What one catalog item is: a stocked good or a service without stock. */
export type ItemKind = "product" | "service";

/**
 * The kind of a catalog item. A business of one type has one kind; a mixed
 * business decides per item, and a service is an item without a stock row.
 */
export function itemKind(type: BusinessType, stock: number | null): ItemKind {
  if (type === "mixed") return stock === null ? "service" : "product";
  return type === "ecommerce" ? "product" : "service";
}

/** Name of a catalog item in tables and forms. */
export const ITEM_LABELS: Record<BusinessType, string> = {
  ecommerce: "Ապրանք",
  service: "Դասընթաց",
  mixed: "Ապրանք / ծառայություն",
};
