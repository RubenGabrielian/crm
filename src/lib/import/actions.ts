"use server";

import { ITEM_KIND_LABELS } from "@/config/product-fields";
import { isCurrentUserPro } from "@/lib/billing/subscription";
import { adjustStock } from "@/lib/inventory/actions";
import { listInventory } from "@/lib/inventory/queries";
import { createMaterial, receiveMaterial } from "@/lib/materials/actions";
import { listMaterials } from "@/lib/materials/queries";
import {
  createProduct,
  updateProduct,
  type ProductFormState,
} from "@/lib/products/actions";
import { listProducts } from "@/lib/products/queries";
import { requirePermission } from "@/lib/tenant/get-current-tenant";
import { IMPORT_MAX_ROWS, readRows, readUpload, type SheetRow } from "./excel";
import {
  CATALOG_SHEET,
  KIND_HEADER,
  MATERIAL,
  MATERIALS_SHEET,
  STOCK,
  STOCK_SHEET,
  catalogFields,
} from "./templates";

export type ImportState = {
  done: boolean;
  /** What changed, as short lines: "Ավելացվեց՝ 12". */
  summary: string[];
  /** Rows that were skipped, with the reason. */
  errors: { row: number; sheet: string; message: string }[];
  formError: string | null;
};

const EMPTY_FORM: ProductFormState = {
  ok: false,
  values: {},
  errors: {},
  formError: null,
};

const failed = (formError: string): ImportState => ({
  done: false,
  summary: [],
  errors: [],
  formError,
});

const TOO_MANY = `Մեկ ֆայլում՝ առավելագույնը ${IMPORT_MAX_ROWS} տող։ Բաժանեք այն մի քանի ֆայլի։`;

/** Whole number from a cell, or null if it isn't one (empty = 0). */
function wholeNumber(text: string): number | null {
  if (text === "") return 0;
  const number = Number(text.replace(/\s/g, "").replace(",", "."));
  return Number.isInteger(number) ? number : null;
}

function amount(text: string): number | null {
  if (text === "") return 0;
  const number = Number(text.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(number) ? number : null;
}

/**
 * Catalog import: each row becomes a product (or course/service). A row whose
 * name matches an existing item updates it instead, so re-importing the same
 * file doesn't create duplicates. Rows are saved through the same actions as
 * the add/edit form, so the checks are identical.
 */
export async function importCatalog(
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const tenant = await requirePermission("catalog_edit");
  const type = tenant.businessType;
  const upload = await readUpload(formData.get("file"));
  if (!upload.ok) return failed(upload.error);

  const fields = catalogFields(type);
  const titleHeader = fields[0].header;
  const sheet = CATALOG_SHEET[type];
  const rows = readRows(upload.workbook, titleHeader, sheet);
  if (!rows)
    return failed(
      `Ֆայլում չգտնվեց «${titleHeader.replace(" *", "")}» սյունակը։ Օգտագործեք ներբեռնված օրինակը։`,
    );
  if (rows.length === 0) return failed("Ֆայլում լրացված տող չկա։");
  if (rows.length > IMPORT_MAX_ROWS) return failed(TOO_MANY);

  const { products, error } = await listProducts(tenant.id);
  if (error) return failed("Չհաջողվեց բեռնել ապրանքները։ Փորձեք կրկին։");
  const existing = new Map(
    products.map((product) => [product.title.trim().toLowerCase(), product.id]),
  );

  const labelOf = new Map(fields.map(({ field }) => [field.name, field.label]));
  const errors: ImportState["errors"] = [];
  const seen = new Map<string, number>();
  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const formFields = new FormData();
    for (const { field, header } of fields) {
      const text = row.get(header);
      // "6 500" and "12,5" are common in sheets; the form expects 6500 and 12.5.
      formFields.set(
        field.name,
        field.kind === "text" ? text : text.replace(/\s/g, "").replace(",", "."),
      );
    }
    const title = row.get(fields[0].header);
    const key = title.toLowerCase();

    if (key && seen.has(key)) {
      errors.push({
        row: row.number,
        sheet,
        message: `«${title}»-ը կրկնվում է (տող ${seen.get(key)})`,
      });
      continue;
    }
    if (key) seen.set(key, row.number);

    if (type === "mixed") {
      const kind = row.get(KIND_HEADER).toLowerCase();
      formFields.set(
        "kind",
        kind === ITEM_KIND_LABELS.service.toLowerCase() || kind === "service"
          ? "service"
          : "product",
      );
    }

    const id = key ? existing.get(key) : undefined;
    const result = id
      ? await updateProduct(id, EMPTY_FORM, formFields)
      : await createProduct(EMPTY_FORM, formFields);
    if (result.ok) {
      if (id) updated += 1;
      else created += 1;
      continue;
    }
    const reasons = Object.entries(result.errors).map(
      ([name, message]) => `${labelOf.get(name) ?? name}՝ ${message}`,
    );
    if (result.formError) reasons.push(result.formError);
    errors.push({ row: row.number, sheet, message: reasons.join("; ") });
  }

  return {
    done: true,
    summary: [
      `Ավելացվեց՝ ${created}`,
      ...(updated ? [`Թարմացվեց՝ ${updated}`] : []),
      ...(errors.length ? [`Բաց թողնվեց՝ ${errors.length}`] : []),
    ],
    errors,
    formError: null,
  };
}

/**
 * Warehouse import: received quantities are added to the products' and
 * materials' stock; a material row with a new name creates that material.
 */
export async function importWarehouse(
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  if (!(await isCurrentUserPro()))
    return failed("Պահեստի ներմուծումը հասանելի է Numa Pro-ով։");
  const tenant = await requirePermission("inventory");
  const upload = await readUpload(formData.get("file"));
  if (!upload.ok) return failed(upload.error);

  const stockRows = readRows(upload.workbook, STOCK.receive, STOCK_SHEET);
  const materialRows = readRows(upload.workbook, MATERIAL.unit, MATERIALS_SHEET);
  if (!stockRows && !materialRows)
    return failed("Ֆայլում չգտնվեցին «Ապրանքներ» և «Նյութեր» թերթերը։ Օգտագործեք ներբեռնված օրինակը։");
  if ((stockRows?.length ?? 0) + (materialRows?.length ?? 0) > IMPORT_MAX_ROWS)
    return failed(TOO_MANY);

  const [{ rows: inventory }, { materials }] = await Promise.all([
    listInventory(tenant.id),
    listMaterials(tenant.id),
  ]);
  const productIds = new Map(
    inventory.map((row) => [row.title.trim().toLowerCase(), row.productId]),
  );
  const materialIds = new Map(
    materials.map((material) => [material.name.trim().toLowerCase(), material.id]),
  );

  const errors: ImportState["errors"] = [];
  const fail = (sheet: string, row: SheetRow, message: string) =>
    errors.push({ row: row.number, sheet, message });
  let received = 0;
  let materialsReceived = 0;
  let materialsCreated = 0;
  const createdNames = new Set<string>();

  for (const row of stockRows ?? []) {
    const title = row.get(STOCK.title);
    const qty = wholeNumber(row.get(STOCK.receive));
    if (qty === null || qty < 0) {
      fail(STOCK_SHEET, row, "«Ավելացնել»՝ մուտքագրեք 0 կամ ավելի ամբողջ թիվ");
      continue;
    }
    if (qty === 0) continue; // nothing arrived
    const id = productIds.get(title.toLowerCase());
    if (!id) {
      fail(
        STOCK_SHEET,
        row,
        title
          ? `«${title}» ապրանքը չգտնվեց պահեստում։ Նախ ավելացրեք այն «Ապրանքներ» էջում։`
          : "Անվանումը դատարկ է",
      );
      continue;
    }
    const result = await adjustStock(id, "receive", qty);
    if (result.ok) received += 1;
    else fail(STOCK_SHEET, row, result.error ?? "Չհաջողվեց պահպանել");
  }

  for (const row of materialRows ?? []) {
    const name = row.get(MATERIAL.name);
    const qty = amount(row.get(MATERIAL.receive));
    if (qty === null || qty < 0) {
      fail(MATERIALS_SHEET, row, "«Ավելացնել»՝ մուտքագրեք 0 կամ ավելի թիվ");
      continue;
    }
    const id = name ? materialIds.get(name.toLowerCase()) : undefined;
    if (id) {
      if (qty === 0) continue;
      const result = await receiveMaterial(id, qty);
      if (result.ok) materialsReceived += 1;
      else fail(MATERIALS_SHEET, row, result.error ?? "Չհաջողվեց պահպանել");
      continue;
    }
    if (!name) {
      fail(MATERIALS_SHEET, row, "Անվանումը դատարկ է");
      continue;
    }
    if (createdNames.has(name.toLowerCase())) {
      fail(MATERIALS_SHEET, row, `«${name}»-ը կրկնվում է ֆայլում`);
      continue;
    }

    const material = new FormData();
    material.set("name", name);
    material.set("unit", row.get(MATERIAL.unit));
    material.set("unit_cost", row.get(MATERIAL.unitCost).replace(/\s/g, ""));
    material.set("quantity", String(qty));
    const result = await createMaterial(
      { ok: false, values: {}, errors: {}, formError: null },
      material,
    );
    if (result.ok) {
      materialsCreated += 1;
      createdNames.add(name.toLowerCase());
    } else {
      const reasons = Object.values(result.errors);
      if (result.formError) reasons.push(result.formError);
      fail(MATERIALS_SHEET, row, reasons.join("; "));
    }
  }

  return {
    done: true,
    summary: [
      `Ապրանքների մուտք՝ ${received}`,
      `Նյութերի մուտք՝ ${materialsReceived}`,
      ...(materialsCreated ? [`Նոր նյութեր՝ ${materialsCreated}`] : []),
      ...(errors.length ? [`Բաց թողնվեց՝ ${errors.length}`] : []),
    ],
    errors,
    formError: null,
  };
}
