import { GraduationCap, Package, TriangleAlert } from "lucide-react";
import { EmptyState } from "@/components/layout/empty-state";
import { AddProductDialog } from "@/components/products/product-dialogs";
import { ProductsTable } from "@/components/products/products-table";
import { PRODUCT_COPY } from "@/config/product-fields";
import { listProducts } from "@/lib/products/queries";
import { getCurrentTenant } from "@/lib/tenant/get-current-tenant";

// Reads live data for the current tenant on every request.
export const instant = false;

export default async function CatalogPage() {
  const tenant = await getCurrentTenant();
  const { products, error } = await listProducts(tenant.id);
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
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">Ընդամենը՝ {products.length}</p>
        <AddProductDialog />
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={tenant.businessType === "ecommerce" ? Package : GraduationCap}
          title={copy.emptyTitle}
          description={copy.emptyDescription}
        />
      ) : (
        <ProductsTable products={products} businessType={tenant.businessType} />
      )}
    </div>
  );
}
