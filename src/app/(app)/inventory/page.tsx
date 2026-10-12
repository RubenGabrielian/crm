import { notFound } from "next/navigation";
import { TriangleAlert, Warehouse } from "lucide-react";
import { StockChangeDialog } from "@/components/inventory/stock-change-dialog";
import { EmptyState } from "@/components/layout/empty-state";
import { ProductThumb } from "@/components/products/product-thumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumber } from "@/lib/format";
import { listInventory } from "@/lib/inventory/queries";
import { hasFeature } from "@/lib/tenant/features";
import { getCurrentTenant } from "@/lib/tenant/get-current-tenant";

// Reads live data for the current tenant on every request.
export const instant = false;

export default async function InventoryPage() {
  const tenant = await getCurrentTenant();
  // Hiding the menu item is not access control; block the URL too.
  if (!hasFeature(tenant.businessType, "inventory")) notFound();

  const { rows, error } = await listInventory(tenant.id);
  if (error) {
    console.error("listInventory failed:", error);
    return (
      <EmptyState
        icon={TriangleAlert}
        title="Չհաջողվեց բեռնել տվյալները"
        description="Ստուգեք կապը տվյալների բազայի հետ և թարմացրեք էջը։"
      />
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Warehouse}
        title="Պահեստը դատարկ է"
        description="Ապրանքների մնացորդը կհայտնվի այստեղ, երբ ավելացնեք առաջին ապրանքը։"
      />
    );
  }

  // Fixed, equal-width number columns so every figure lines up under its heading.
  const numeric = "px-4 text-right tabular-nums";
  const heading =
    "h-auto px-4 py-3 text-right align-bottom text-xs leading-snug font-medium whitespace-normal text-muted-foreground";

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted-foreground">Ընդամենը՝ {rows.length}</p>
      <div className="overflow-hidden rounded-3xl bg-card p-3 shadow-soft">
        <Table className="min-w-[52rem] table-fixed">
          <colgroup>
            <col />
            <col className="w-[7.25rem]" />
            <col className="w-[7.25rem]" />
            <col className="w-[7.25rem]" />
            <col className="w-[7.25rem]" />
            <col className="w-24" />
            <col className="w-48" />
          </colgroup>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={heading.replace("text-right", "text-left")}>
                Ապրանք / նյութ
              </TableHead>
              <TableHead className={heading}>Մուտքագրված ընդհանուր քանակ</TableHead>
              <TableHead className={heading}>Վաճառքներից դուրս գրված</TableHead>
              <TableHead className={heading}>Նվերներից դուրս գրված</TableHead>
              <TableHead className={heading}>Ընդհանուր օգտագործված</TableHead>
              <TableHead className={heading}>Առկա քանակ</TableHead>
              <TableHead className="h-auto px-4">
                <span className="sr-only">Գործողություններ</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.productId}>
                <TableCell className="px-4 font-medium">
                  <span className="flex min-w-0 items-center gap-3">
                    <ProductThumb src={row.imageUrl} alt="" />
                    <span className="min-w-0 whitespace-normal">{row.title}</span>
                  </span>
                </TableCell>
                <TableCell className={numeric}>{formatNumber(row.received)}</TableCell>
                <TableCell className={`${numeric} text-muted-foreground`}>
                  {formatNumber(row.sold)}
                </TableCell>
                <TableCell className={`${numeric} text-muted-foreground`}>
                  {formatNumber(row.gifted)}
                </TableCell>
                <TableCell className={`${numeric} text-muted-foreground`}>
                  {formatNumber(row.used)}
                </TableCell>
                <TableCell className={`${numeric} font-semibold`}>
                  {row.available === 0 ? (
                    <span className="text-destructive">Սպառված է</span>
                  ) : (
                    formatNumber(row.available)
                  )}
                </TableCell>
                <TableCell className="px-4">
                  <span className="flex justify-end gap-1.5">
                    <StockChangeDialog
                      kind="receive"
                      productId={row.productId}
                      title={row.title}
                      available={row.available}
                    />
                    <StockChangeDialog
                      kind="gift"
                      productId={row.productId}
                      title={row.title}
                      available={row.available}
                    />
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
