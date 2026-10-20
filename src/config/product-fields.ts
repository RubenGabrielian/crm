import type { BusinessType, ItemKind } from "@/lib/tenant/features";

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

const GOODS_FIELDS: ProductField[] = [
  { name: "unit_cost", label: "Ինքնարժեք (֏)", kind: "money", required: true, min: 0, target: "metadata" },
  { name: "delivery_cost", label: "Առաքման արժեք (֏)", kind: "money", required: false, min: 0, target: "metadata" },
  { name: "stock", label: "Առկա քանակ", kind: "integer", required: true, min: 0, target: "stock" },
];

const COURSE_FIELDS: ProductField[] = [
  { name: "teacher_name", label: "Դասախոս", kind: "text", required: true, target: "metadata" },
  { name: "max_students", label: "Խմբի քանակ", kind: "integer", required: true, min: 1, target: "metadata" },
  { name: "schedule", label: "Դասացուցակ", kind: "text", required: false, target: "metadata" },
];

/** A service sold next to goods, e.g. fitting: no stock, cost is optional. */
const SERVICE_FIELDS: ProductField[] = [
  { name: "unit_cost", label: "Ինքնարժեք (֏)", kind: "money", required: false, min: 0, target: "metadata" },
  { name: "duration", label: "Տևողություն", kind: "text", required: false, target: "metadata" },
];

/** Fields of one catalog item. Drives the add form and the server checks. */
export function productFields(type: BusinessType, kind: ItemKind): ProductField[] {
  if (kind === "product") return GOODS_FIELDS;
  return type === "service" ? COURSE_FIELDS : SERVICE_FIELDS;
}

/** Table columns: every field any item of this business can have. */
export function productColumns(type: BusinessType): ProductField[] {
  if (type === "ecommerce") return GOODS_FIELDS;
  if (type === "service") return COURSE_FIELDS;
  const columns = [...GOODS_FIELDS];
  for (const field of SERVICE_FIELDS)
    if (!columns.some((column) => column.name === field.name)) columns.push(field);
  return columns;
}

export const ITEM_KIND_LABELS: Record<ItemKind, string> = {
  product: "Ապրանք",
  service: "Ծառայություն",
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
  mixed: {
    add: "Ավելացնել",
    edit: "Խմբագրել",
    deleteDescription:
      "Այն կհեռացվի ցանկից (և պահեստից, եթե ապրանք է), իսկ վճարման հղումը կդադարի աշխատել։ Նախկին պատվերները կպահպանվեն։",
    emptyTitle: "Դեռ ապրանքներ կամ ծառայություններ չկան",
    emptyDescription:
      "Ավելացրեք ապրանք (պահեստով) կամ ծառայություն (օր.՝ տեղադրում)։ Մեկ պատվերում կարող եք միավորել երկուսն էլ։",
  },
};
