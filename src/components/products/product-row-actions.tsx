"use client";

import type { Product } from "@/lib/products/queries";
import { CopyCheckoutLink } from "./copy-checkout-link";
import { DeleteProductDialog, EditProductDialog } from "./product-dialogs";

export function ProductRowActions({ product }: { product: Product }) {
  return (
    <span className="flex items-center justify-end gap-1">
      <CopyCheckoutLink productId={product.id} />
      <EditProductDialog product={product} />
      <DeleteProductDialog product={product} />
    </span>
  );
}
