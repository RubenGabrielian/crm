import type { BusinessType } from "@/lib/tenant/features";

export type ProductFieldKind = "text" | "money" | "integer";

export type ProductField = {
  name: string;
  label: string;
  kind: ProductFieldKind;
  required: boolean;
  min?: number;
  /** Where the value is saved: products.metadata or inventory.stock_quantity. */
  target: "metadata" | "stock";
};

export const BASE_PRODUCT_FIELDS: ProductField[] = [
  { name: "title", label: "Անվանում", kind: "text", required: true, target: "metadata" },
  { name: "price", label: "Գին (֏)", kind: "money", required: true, min: 0, target: "metadata" },
];

/** Type-specific fields. Drives both the add form and the table columns. */
export const PRODUCT_FIELDS: Record<BusinessType, ProductField[]> = {
  ecommerce: [
    { name: "unit_cost", label: "Ինքնարժեք (֏)", kind: "money", required: true, min: 0, target: "metadata" },
    { name: "delivery_cost", label: "Առաքման արժեք (֏)", kind: "money", required: false, min: 0, target: "metadata" },
    { name: "stock", label: "Առկա քանակ", kind: "integer", required: true, min: 0, target: "stock" },
  ],
  service: [
    { name: "teacher_name", label: "Դասախոս", kind: "text", required: true, target: "metadata" },
    { name: "max_students", label: "Խմբի քանակ", kind: "integer", required: true, min: 1, target: "metadata" },
    { name: "schedule", label: "Դասացուցակ", kind: "text", required: false, target: "metadata" },
  ],
};

export const PRODUCT_COPY: Record<
  BusinessType,
  {
    add: string;
    edit: string;
    deleteDescription: string;
    emptyTitle: string;
    emptyDescription: string;
  }
> = {
  ecommerce: {
    add: "Ավելացնել ապրանք",
    edit: "Խմբագրել ապրանքը",
    deleteDescription:
      "Ապրանքը կհեռացվի ցանկից և պահեստից, իսկ վճարման հղումը կդադարի աշխատել։ Նախկին պատվերները կպահպանվեն։",
    emptyTitle: "Դեռ ապրանքներ չկան",
    emptyDescription:
      "Ավելացրեք առաջին ապրանքը՝ գնով, ինքնարժեքով և առկա քանակով։",
  },
  service: {
    add: "Ավելացնել դասընթաց",
    edit: "Խմբագրել դասընթացը",
    deleteDescription:
      "Դասընթացը կհեռացվի ցանկից, իսկ գրանցման հղումը կդադարի աշխատել։ Նախկին գրանցումները կպահպանվեն։",
    emptyTitle: "Դեռ դասընթացներ չկան",
    emptyDescription:
      "Ավելացրեք առաջին դասընթացը՝ գնով, դասախոսով և խմբի քանակով։",
  },
};
