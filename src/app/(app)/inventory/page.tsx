import { notFound } from "next/navigation";
import { TriangleAlert, Warehouse } from "lucide-react";
import { EditStockDialog } from "@/components/inventory/edit-stock-dialog";
import { StockChangeDialog } from "@/components/inventory/stock-change-dialog";
import { StockTable, type StockRow } from "@/components/inventory/stock-table";
import { EmptyState } from "@/components/layout/empty-state";
import {
  AddMaterialDialog,
  DeleteMaterialDialog,
  EditMaterialDialog,
  ReceiveMaterialDialog,
} from "@/components/materials/material-dialogs";
import { formatNumber } from "@/lib/format";
import { listInventory } from "@/lib/inventory/queries";
import { listMaterials } from "@/lib/materials/queries";
import { hasFeature } from "@/lib/tenant/features";
import { getCurrentTenant } from "@/lib/tenant/get-current-tenant";

// Reads live data for the current tenant on every request.
export const instant = false;

export default async function InventoryPage() {
  const tenant = await getCurrentTenant();
  // Hiding the menu item is not access control; block the URL too.
  if (!hasFeature(tenant.businessType, "inventory")) notFound();

  const [{ rows, error }, { materials, error: materialsError }] =
    await Promise.all([listInventory(tenant.id), listMaterials(tenant.id)]);
  if (materialsError) console.error("listMaterials failed:", materialsError);
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

  if (rows.length === 0 && materials.length === 0) {
    return (
      <EmptyState
        icon={Warehouse}
        title="Պահեստը դատարկ է"
        description="Ապրանքների մնացորդը կհայտնվի այստեղ, երբ ավելացնեք առաջին ապրանքը։ Փաթեթավորումը և այլ նյութերը կարող եք ավելացնել հենց հիմա։"
        action={<AddMaterialDialog />}
      />
    );
  }

  const productRows: StockRow[] = rows.map((row) => ({
    key: row.productId,
    name: row.title,
    thumb: row.imageUrl,
    received: row.received,
    sales: row.sold,
    gifts: row.gifted,
    available: row.available,
    actions: (
      <>
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
        <EditStockDialog
          productId={row.productId}
          title={row.title}
          counts={{
            available: row.available,
            sold: row.sold,
            gifted: row.gifted,
          }}
        />
      </>
    ),
  }));

  const materialRows: StockRow[] = materials.map((material) => ({
    key: material.id,
    name: material.name,
    note: material.unit,
    thumb: material.imageUrl,
    received: material.received,
    sales: material.usedInSales,
    gifts: material.usedInGifts,
    available: material.available,
    actions: (
      <>
        <ReceiveMaterialDialog material={material} />
        <EditMaterialDialog material={material} />
        <DeleteMaterialDialog material={material} />
      </>
    ),
  }));

  return (
    <div className="flex flex-col gap-10">
      {productRows.length > 0 && (
        <section className="flex flex-col gap-4">
          <SectionHeading
            title="Ապրանքներ"
            count={productRows.length}
            text="Վաճառքից դուրս գրվածը հաշվվում է պատվերներից ավտոմատ։"
          />
          <StockTable rows={productRows} nameLabel="Ապրանք" />
        </section>
      )}

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            title="Նյութեր և փաթեթավորում"
            count={materialRows.length}
            text="Չեն վաճառվում առանձին, բայց ծախսվում են ամեն վաճառքի և նվերի հետ՝ ըստ ապրանքի կարգավորման։"
          />
          <AddMaterialDialog />
        </div>
        {materialRows.length === 0 ? (
          <p className="rounded-3xl bg-card px-6 py-8 text-center text-sm text-muted-foreground shadow-soft">
            Դեռ նյութեր չկան։ Ավելացրեք, օրինակ, տոպրակ կամ պիտակ, ապա ապրանքի
            մեջ նշեք, թե որքան է ծախսվում ամեն վաճառքից։
          </p>
        ) : (
          <StockTable rows={materialRows} nameLabel="Նյութ" />
        )}
      </section>
    </div>
  );
}

function SectionHeading({
  title,
  count,
  text,
}: {
  title: string;
  count: number;
  text: string;
}) {
  return (
    <div>
      <h2 className="flex items-baseline gap-2 text-lg font-semibold tracking-tight">
        {title}
        <span className="text-sm font-normal text-muted-foreground tabular-nums">
          {formatNumber(count)}
        </span>
      </h2>
      <p className="mt-1 max-w-xl text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
