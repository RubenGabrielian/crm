import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ITEM_KIND_LABELS,
  productColumns,
  type ProductField,
} from "@/config/product-fields";
import { formatMoney, formatNumber } from "@/lib/format";
import type { Product } from "@/lib/products/queries";
import { itemKind, type BusinessType } from "@/lib/tenant/features";
import { COST_FIELDS } from "@/lib/tenant/permissions";
import { ProductRowActions } from "./product-row-actions";
import { ProductThumb } from "./product-thumb";

function formatCell(field: ProductField, product: Product) {
  const value =
    field.target === "stock" ? product.stock : product.metadata[field.name];
  if (value === null || value === undefined || value === "") return "—";
  if (field.kind === "money") return formatMoney(Number(value));
  if (field.kind === "integer") return formatNumber(Number(value));
  return String(value);
}

export function ProductsTable({
  products,
  businessType,
  showCost,
}: {
  products: Product[];
  businessType: BusinessType;
  /** False for employees who may not see cost prices: the column is left out. */
  showCost: boolean;
}) {
  const fields = productColumns(businessType).filter(
    (field) => showCost || !COST_FIELDS.includes(field.name),
  );
  const showsKind = businessType === "mixed";

  return (
    <div className="overflow-hidden rounded-3xl bg-card p-3 shadow-soft">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="px-4">Անվանում</TableHead>
            {showsKind && <TableHead className="px-4">Տեսակ</TableHead>}
            <TableHead className="px-4 text-right">Գին</TableHead>
            {fields.map((field) => (
              <TableHead
                key={field.name}
                className={field.kind === "text" ? "px-4" : "px-4 text-right"}
              >
                {field.label.replace(" (֏)", "")}
              </TableHead>
            ))}
            <TableHead className="px-4 text-right">
              <span className="sr-only">Գործողություններ</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="px-4 font-medium">
                <span className="flex items-center gap-3">
                  <ProductThumb src={product.imageUrl} alt="" />
                  {product.title}
                </span>
              </TableCell>
              {showsKind && (
                <TableCell className="px-4 text-muted-foreground">
                  {ITEM_KIND_LABELS[itemKind(businessType, product.stock)]}
                </TableCell>
              )}
              <TableCell className="px-4 text-right tabular-nums">
                {formatMoney(product.price)}
              </TableCell>
              {fields.map((field) => (
                <TableCell
                  key={field.name}
                  className={
                    field.kind === "text"
                      ? "px-4 text-muted-foreground"
                      : "px-4 text-right tabular-nums text-muted-foreground"
                  }
                >
                  {formatCell(field, product)}
                </TableCell>
              ))}
              <TableCell className="px-4 text-right">
                <ProductRowActions product={product} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
