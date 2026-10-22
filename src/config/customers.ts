/** Fields the CRM search can look in; "all" looks in every one. */
export const CUSTOMER_SEARCH_FIELDS = [
  "all",
  "name",
  "phone",
  "email",
  "address",
  "comment",
] as const;
export type CustomerSearchField = (typeof CUSTOMER_SEARCH_FIELDS)[number];

export function isCustomerSearchField(value: unknown): value is CustomerSearchField {
  return CUSTOMER_SEARCH_FIELDS.includes(value as CustomerSearchField);
}
