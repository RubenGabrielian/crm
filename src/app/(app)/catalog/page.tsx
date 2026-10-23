import Link from "next/link";
import { connection } from "next/server";
import { GraduationCap, Package, TriangleAlert } from "lucide-react";
import { ExcelImportDialog } from "@/components/import/excel-import-dialog";
import { EmptyState } from "@/components/layout/empty-state";
import { Pagination, parsePage } from "@/components/layout/pagination";
import { CatalogSearch } from "@/components/products/catalog-search";
import { AddProductDialog } from "@/components/products/product-dialogs";
import { ProductsTable } from "@/components/products/products-table";
import { PRODUCT_COPY } from "@/config/product-fields";
import { listMaterials } from "@/lib/materials/queries";
import { listProducts } from "@/lib/products/queries";
import { MaterialsProvider } from "@/components/materials/materials-context";
import { formatNumber } from "@/lib/format";
import {
  getCurrentAccess,
  requirePermission,
} from "@/lib/tenant/get-current-tenant";
import { can } from "@/lib/tenant/permissions";

// Reads live data for the current tenant on every request.
export const instant = false;

const CATALOG_PAGE_SIZE = 30;

export default async function CatalogPage({
  searchParams,
}: PageProps<"/catalog">) {
  // Search and page come from the URL, so this page is rendered per request.
  await connection();
  const tenant = await requirePermission("catalog");
  const access = await getCurrentAccess();
  const canEdit = can(access, "catalog_edit");
  const [{ products, error }, { materials }] = await Promise.all([
    listProducts(tenant.id),
    tenant.businessType !== "service"
      ? listMaterials(tenant.id)
      : Promise.resolve({ materials: [] }),
  ]);
  const materialOptions = materials.map(({ id, name, unit, unitCost }) => ({
    id,
    name,
    unit,
    unitCost,
  }));
  const copy = PRODUCT_COPY[tenant.businessType];

  const query = await searchParams;
  const search = typeof query.q === "string" ? query.q.trim() : "";
  const needle = search.toLowerCase();
  const found = needle
    ? products.filter((product) => product.title.toLowerCase().includes(needle))
    : products;
  const lastPage = Math.max(Math.ceil(found.length / CATALOG_PAGE_SIZE), 1);
  const page = Math.min(parsePage(query.page), lastPage);
  const pageProducts = found.slice(
    (page - 1) * CATALOG_PAGE_SIZE,
    page * CATALOG_PAGE_SIZE,
  );

  if (error) {
    console.error("listProducts failed:", error);
    return (
      <EmptyState
        icon={TriangleAlert}
        title="Չհաջողվեց բեռնել տվյալները"
        description="Ստուգեք կապը տվյալների բազայի հետ և թարմացրեք էջը։"
      />
    );
  }

  return (
    <MaterialsProvider materials={materialOptions}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {products.length > 0 ? (
            <CatalogSearch
              search={search}
              placeholder={
                tenant.businessType === "service"
                  ? "Որոնել դասընթաց անունով…"
                  : "Որոնել անունով…"
              }
            />
          ) : (
            <span />
          )}
          {canEdit && (
            <div className="flex flex-wrap justify-end gap-2">
              <ExcelImportDialog
                target="catalog"
                description={
                  tenant.businessType === "service"
                    ? "Ավելացրեք շատ դասընթացներ միանգամից։ Նույն անվանումով դասընթացը կթարմացվի։"
                    : "Ավելացրեք շատ ապրանքներ միանգամից։ Նույն անվանումով ապրանքը կթարմացվի։"
                }
              />
              <AddProductDialog />
            </div>
          )}
        </div>

        {products.length > 0 && (
          <p className="-mt-2 text-sm text-muted-foreground">
            {search
              ? `Գտնվեց՝ ${formatNumber(found.length)} / ${formatNumber(products.length)}`
              : `Ընդամենը՝ ${formatNumber(products.length)}`}
          </p>
        )}

        {products.length === 0 ? (
          <EmptyState
            icon={tenant.businessType === "service" ? GraduationCap : Package}
            title={copy.emptyTitle}
            description={copy.emptyDescription}
          />
        ) : found.length === 0 ? (
          <p className="rounded-3xl bg-card px-6 py-10 text-center text-sm text-muted-foreground shadow-soft">
            Այս անունով ոչինչ չգտնվեց։{" "}
            <Link
              href="/catalog"
              className="font-medium text-foreground underline underline-offset-2"
            >
              Մաքրել որոնումը
            </Link>
          </p>
        ) : (
          <ProductsTable
            products={pageProducts}
            businessType={tenant.businessType}
            showCost={can(access, "cost_view")}
          />
        )}
        <Pagination
          basePath="/catalog"
          params={{ q: search || undefined }}
          page={page}
          total={found.length}
          pageSize={CATALOG_PAGE_SIZE}
        />
      </div>
    </MaterialsProvider>
  );
}
