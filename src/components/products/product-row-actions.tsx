"use client";

import type { Product } from "@/lib/products/queries";
import { useCan } from "@/lib/tenant/tenant-context";
import { CopyCheckoutLink } from "./copy-checkout-link";
import { DeleteProductDialog, EditProductDialog } from "./product-dialogs";

export function ProductRowActions({ product }: { product: Product }) {
  // Employees without catalog editing only copy checkout links.
  const canEdit = useCan("catalog_edit");
  return (
    <span className="flex items-center justify-end gap-1">
      <CopyCheckoutLink product={product} />
      {canEdit && <EditProductDialog product={product} />}
      {canEdit && <DeleteProductDialog product={product} />}
    </span>
  );
}
