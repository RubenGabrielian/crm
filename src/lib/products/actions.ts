"use server";

import { revalidatePath } from "next/cache";
import {
  BASE_PRODUCT_FIELDS,
  productFields,
  type ProductField,
} from "@/config/product-fields";
import {
  PRODUCT_IMAGE_BUCKET,
  PRODUCT_IMAGE_ERRORS,
  PRODUCT_IMAGE_MAX_BYTES,
  PRODUCT_IMAGE_TYPES,
} from "@/config/product-images";
import { createAuthClient } from "@/lib/supabase/server";
import {
  itemKind,
  type BusinessType,
  type ItemKind,
} from "@/lib/tenant/features";
import { getCurrentTenant } from "@/lib/tenant/get-current-tenant";

export type ProductFormState = {
  ok: boolean;
  values: Record<string, string>;
  errors: Record<string, string>;
  formError: string | null;
};

const SAVE_FAILED = "Չհաջողվեց պահպանել։ Փորձեք կրկին։";
const UPLOAD_FAILED = "Չհաջողվեց վերբեռնել նկարը։ Փորձեք կրկին։";

type Parsed = { value: string | number | null } | { error: string };

function parseField(field: ProductField, raw: string): Parsed {
  if (raw === "") {
    return field.required ? { error: "Պարտադիր դաշտ է" } : { value: null };
  }
  if (field.kind === "text") return { value: raw };

  const number = Number(raw);
  if (!Number.isFinite(number)) return { error: "Մուտքագրեք թիվ" };
  if (field.kind === "integer" && !Number.isInteger(number)) {
    return { error: "Մուտքագրեք ամբողջ թիվ" };
  }
  if (field.min !== undefined && number < field.min) {
    return { error: `Նվազագույն արժեքը ${field.min} է` };
  }
  return { value: number };
}

function parseProductForm(
  formData: FormData,
  businessType: BusinessType,
  kind: ItemKind,
) {
  const typeFields = productFields(businessType, kind);
  const values: Record<string, string> = {};
  const errors: Record<string, string> = {};
  const parsed: Record<string, string | number | null> = {};

  for (const field of [...BASE_PRODUCT_FIELDS, ...typeFields]) {
    const raw = String(formData.get(field.name) ?? "").trim();
    values[field.name] = raw;
    const result = parseField(field, raw);
    if ("error" in result) errors[field.name] = result.error;
    else parsed[field.name] = result.value;
  }

  const image = formData.get("image");
  const imageFile = image instanceof File && image.size > 0 ? image : null;
  if (imageFile) {
    if (!(imageFile.type in PRODUCT_IMAGE_TYPES))
      errors.image = PRODUCT_IMAGE_ERRORS.type;
    else if (imageFile.size > PRODUCT_IMAGE_MAX_BYTES)
      errors.image = PRODUCT_IMAGE_ERRORS.size;
  }

  // Type-specific values: one goes to inventory, the rest to products.metadata.
  const metadata: Record<string, string | number> = {};
  let stock: number | null = null;
  for (const field of typeFields) {
    const value = parsed[field.name];
    if (value === null || value === undefined) continue;
    if (field.target === "stock") stock = value as number;
    else metadata[field.name] = value;
  }

  return {
    values,
    errors,
    hasErrors: Object.keys(errors).length > 0,
    title: parsed.title as string,
    price: parsed.price as number,
    metadata,
    stock,
    imageFile,
  };
}

/** Returns the public URL, or null if the upload failed. */
async function uploadProductImage(
  tenantId: string,
  file: File,
): Promise<string | null> {
  const supabase = await createAuthClient();
  const bucket = supabase.storage.from(PRODUCT_IMAGE_BUCKET);
  const path = `${tenantId}/${crypto.randomUUID()}.${PRODUCT_IMAGE_TYPES[file.type]}`;
  const { error } = await bucket.upload(path, file, { contentType: file.type });
  if (error) {
    console.error("product image upload failed:", error);
    return null;
  }
  return bucket.getPublicUrl(path).data.publicUrl;
}

type MaterialUse = { materialId: string; quantity: number };

/** The "materials" field: JSON list of { materialId, quantity }. */
function parseMaterials(
  formData: FormData,
): MaterialUse[] | { error: string } | null {
  const raw = formData.get("materials");
  if (raw === null) return null; // the form doesn't manage materials (services)
  let list: unknown;
  try {
    list = JSON.parse(String(raw) || "[]");
  } catch {
    return { error: "Նյութերի ցանկը սխալ է" };
  }
  if (!Array.isArray(list)) return { error: "Նյութերի ցանկը սխալ է" };
  const uses = new Map<string, number>();
  for (const item of list) {
    const materialId = String((item as MaterialUse)?.materialId ?? "");
    const quantity = Number((item as MaterialUse)?.quantity);
    if (!materialId) continue; // an empty row
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return { error: "Յուրաքանչյուր նյութի քանակը պետք է լինի 0-ից մեծ" };
    }
    uses.set(materialId, quantity);
  }
  return [...uses.entries()].map(([materialId, quantity]) => ({
    materialId,
    quantity,
  }));
}

/** Replaces what one unit of the product uses. Only the tenant's own materials. */
async function saveProductMaterials(
  tenantId: string,
  productId: string,
  uses: MaterialUse[],
): Promise<boolean> {
  const supabase = await createAuthClient();
  const { error: clearError } = await supabase
    .from("product_materials")
    .delete()
    .eq("product_id", productId)
    .eq("tenant_id", tenantId);
  if (clearError) {
    console.error("clearing product materials failed:", clearError);
    return false;
  }
  if (uses.length === 0) return true;

  const { data: owned } = await supabase
    .from("materials")
    .select("id")
    .eq("tenant_id", tenantId)
    .in(
      "id",
      uses.map((use) => use.materialId),
    );
  const ownedIds = new Set((owned ?? []).map((row) => row.id));
  const rows = uses
    .filter((use) => ownedIds.has(use.materialId))
    .map((use) => ({
      tenant_id: tenantId,
      product_id: productId,
      material_id: use.materialId,
      quantity: use.quantity,
    }));
  if (rows.length === 0) return true;

  const { error } = await supabase.from("product_materials").insert(rows);
  if (error) console.error("saving product materials failed:", error);
  return !error;
}

function revalidateProductPages() {
  revalidatePath("/catalog");
  revalidatePath("/inventory");
}

export async function createProduct(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const supabase = await createAuthClient();
  // The tenant and its business type come from the server, never the form;
  // only a mixed business picks per item whether it is a good or a service.
  const tenant = await getCurrentTenant();
  const kind: ItemKind =
    tenant.businessType === "mixed"
      ? formData.get("kind") === "service"
        ? "service"
        : "product"
      : itemKind(tenant.businessType, null);
  const form = parseProductForm(formData, tenant.businessType, kind);
  const { values } = form;
  const materials = parseMaterials(formData);
  if (materials && "error" in materials)
    form.errors.materials = materials.error;
  if (form.hasErrors || form.errors.materials) {
    return { ok: false, values, errors: form.errors, formError: null };
  }
  const fail = (formError: string): ProductFormState => ({
    ok: false,
    values,
    errors: {},
    formError,
  });

  // Upload first: if it fails, no product is created.
  let imageUrl: string | null = null;
  if (form.imageFile) {
    imageUrl = await uploadProductImage(tenant.id, form.imageFile);
    if (!imageUrl) return fail(UPLOAD_FAILED);
  }

  const { data: created, error } = await supabase.rpc("create_product", {
    p_tenant_id: tenant.id,
    p_title: form.title,
    p_price: form.price,
    p_metadata: form.metadata,
    p_stock: form.stock,
  });
  if (error) {
    console.error("create_product failed:", error);
    return fail(SAVE_FAILED);
  }

  if (imageUrl) {
    const { error: imageError } = await supabase
      .from("products")
      .update({ image_url: imageUrl })
      .eq("id", created.id);
    if (imageError) console.error("saving image_url failed:", imageError);
  }

  if (
    Array.isArray(materials) &&
    !(await saveProductMaterials(tenant.id, created.id, materials))
  ) {
    revalidateProductPages();
    return fail(
      "Ապրանքը պահպանվեց, բայց նյութերը՝ ոչ։ Խմբագրեք ապրանքը և փորձեք կրկին։",
    );
  }

  revalidateProductPages();
  return { ok: true, values: {}, errors: {}, formError: null };
}

export async function updateProduct(
  productId: string,
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const supabase = await createAuthClient();
  const tenant = await getCurrentTenant();
  const failWith = (formError: string): ProductFormState => ({
    ok: false,
    values: {},
    errors: {},
    formError,
  });

  // Only a product of the current tenant can be edited. Its kind stays as it
  // was created: a good keeps its stock row, a service never gets one.
  const { data: existing, error: loadError } = await supabase
    .from("products")
    .select("id, metadata, inventory(stock_quantity)")
    .eq("id", productId)
    .eq("tenant_id", tenant.id)
    .eq("is_active", true)
    .maybeSingle();
  if (loadError) {
    console.error("loading product failed:", loadError);
    return failWith(SAVE_FAILED);
  }
  if (!existing) return failWith("Ապրանքը չի գտնվել։ Թարմացրեք էջը։");
  const stockRow = Array.isArray(existing.inventory)
    ? existing.inventory[0]
    : existing.inventory;
  const kind = itemKind(tenant.businessType, stockRow?.stock_quantity ?? null);

  const form = parseProductForm(formData, tenant.businessType, kind);
  const { values } = form;
  const materials = parseMaterials(formData);
  if (materials && "error" in materials)
    form.errors.materials = materials.error;
  if (form.hasErrors || form.errors.materials) {
    return { ok: false, values, errors: form.errors, formError: null };
  }
  const fail = (formError: string): ProductFormState => ({
    ok: false,
    values,
    errors: {},
    formError,
  });

  // Keep metadata keys this form doesn't manage; replace the ones it does,
  // so clearing an optional field removes it.
  const metadata = {
    ...((existing.metadata ?? {}) as Record<string, unknown>),
  };
  for (const field of productFields(tenant.businessType, kind)) {
    if (field.target === "metadata") delete metadata[field.name];
  }
  Object.assign(metadata, form.metadata);

  const changes: Record<string, unknown> = {
    title: form.title,
    price: form.price,
    metadata,
  };
  if (form.imageFile) {
    const imageUrl = await uploadProductImage(tenant.id, form.imageFile);
    if (!imageUrl) return fail(UPLOAD_FAILED);
    changes.image_url = imageUrl;
  } else if (formData.get("remove_image") === "1") {
    changes.image_url = null;
  }

  const { error } = await supabase
    .from("products")
    .update(changes)
    .eq("id", productId)
    .eq("tenant_id", tenant.id);
  if (error) {
    console.error("updating product failed:", error);
    return fail(SAVE_FAILED);
  }

  if (form.stock !== null) {
    const { error: stockError } = await supabase.from("inventory").upsert(
      {
        tenant_id: tenant.id,
        product_id: productId,
        stock_quantity: form.stock,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "product_id" },
    );
    if (stockError) {
      console.error("updating stock failed:", stockError);
      revalidateProductPages();
      return fail("Ապրանքը պահպանվեց, բայց քանակը չթարմացվեց։ Փորձեք կրկին։");
    }
  }

  if (
    Array.isArray(materials) &&
    !(await saveProductMaterials(tenant.id, productId, materials))
  ) {
    revalidateProductPages();
    return fail("Ապրանքը պահպանվեց, բայց նյութերը՝ ոչ։ Փորձեք կրկին։");
  }

  revalidateProductPages();
  return { ok: true, values: {}, errors: {}, formError: null };
}

export async function deleteProduct(
  productId: string,
): Promise<{ ok: boolean; error: string | null }> {
  const supabase = await createAuthClient();
  const tenant = await getCurrentTenant();

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("tenant_id", tenant.id);

  if (error?.code === "23503") {
    // The product has orders. Deleting it would break order history, so it is
    // archived instead: hidden from every list and its checkout link stops working.
    const { error: archiveError } = await supabase
      .from("products")
      .update({ is_active: false })
      .eq("id", productId)
      .eq("tenant_id", tenant.id);
    if (archiveError) {
      console.error("archiving product failed:", archiveError);
      return { ok: false, error: "Չհաջողվեց ջնջել։ Փորձեք կրկին։" };
    }
  } else if (error) {
    console.error("deleting product failed:", error);
    return { ok: false, error: "Չհաջողվեց ջնջել։ Փորձեք կրկին։" };
  }

  revalidateProductPages();
  return { ok: true, error: null };
}
