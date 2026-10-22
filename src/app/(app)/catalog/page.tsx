import { GraduationCap, Package, TriangleAlert } from "lucide-react";
import { ExcelImportDialog } from "@/components/import/excel-import-dialog";
import { EmptyState } from "@/components/layout/empty-state";
import { AddProductDialog } from "@/components/products/product-dialogs";
import { ProductsTable } from "@/components/products/products-table";
import { PRODUCT_COPY } from "@/config/product-fields";
import { listMaterials } from "@/lib/materials/queries";
import { listProducts } from "@/lib/products/queries";
import { MaterialsProvider } from "@/components/materials/materials-context";
import { getCurrentTenant } from "@/lib/tenant/get-current-tenant";

// Reads live data for the current tenant on every request.
export const instant = false;

export default async function CatalogPage() {
  const tenant = await getCurrentTenant();
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
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Ընդամենը՝ {products.length}
          </p>
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
        </div>

        {products.length === 0 ? (
          <EmptyState
            icon={tenant.businessType === "service" ? GraduationCap : Package}
            title={copy.emptyTitle}
            description={copy.emptyDescription}
          />
        ) : (
          <ProductsTable
            products={products}
            businessType={tenant.businessType}
          />
        )}
      </div>
    </MaterialsProvider>
  );
}
