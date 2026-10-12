export const BUSINESS_TYPES = ["ecommerce", "service"] as const;
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
} as const satisfies Record<BusinessType, Record<Feature, boolean>>;

export function hasFeature(type: BusinessType, feature: Feature): boolean {
  return FEATURES[type][feature];
}

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  ecommerce: "Առցանց խանութ",
  service: "Ծառայություններ",
};

export function isBusinessType(value: unknown): value is BusinessType {
  return BUSINESS_TYPES.includes(value as BusinessType);
}
