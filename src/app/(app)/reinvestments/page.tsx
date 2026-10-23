import { connection } from "next/server";
import { Sprout, TriangleAlert } from "lucide-react";
import { EmptyState } from "@/components/layout/empty-state";
import {
  AddReinvestmentDialog,
  DeleteReinvestmentDialog,
  ReinvestmentStatusSelect,
} from "@/components/reinvestments/reinvestment-controls";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  REINVESTMENT_STATUSES,
  REINVESTMENT_STATUS_LABELS,
} from "@/config/reinvestments";
import { resolveRange } from "@/lib/analytics/range";
import { formatMoney, formatNumber } from "@/lib/format";
import { listProducts } from "@/lib/products/queries";
import { listReinvestments } from "@/lib/reinvestments/queries";
import { demoReinvestments } from "@/lib/billing/demo-data";
import { isCurrentUserPro } from "@/lib/billing/subscription";
import { requirePermission } from "@/lib/tenant/get-current-tenant";
import { ITEM_LABELS } from "@/lib/tenant/features";

function displayDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}.${month}.${year}`;
}

// Reads live data for the current tenant on every request.
export const instant = false;

export default async function ReinvestmentsPage() {
  // "Today" is used as the default date in the form.
  await connection();
  const tenant = await requirePermission("reinvestments");
  const today = resolveRange({ range: "today" }).to;

  // Free accounts see the page with sample data (ProGate labels it as a demo).
  const [{ reinvestments, error }, { products }] = (await isCurrentUserPro())
    ? await Promise.all([listReinvestments(tenant.id), listProducts(tenant.id)])
    : [
        { reinvestments: demoReinvestments(today, tenant.businessType), error: null },
        { products: [] },
      ];
  const productOptions = products.map(({ id, title }) => ({ id, title }));
  const total = reinvestments.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">Ընդամենը՝ {reinvestments.length}</p>
        <AddReinvestmentDialog today={today} products={productOptions} />
      </div>

      {error ? (
        <EmptyState
          icon={TriangleAlert}
          title="Չհաջողվեց բեռնել տվյալները"
          description="Ստուգեք կապը տվյալների բազայի հետ և թարմացրեք էջը։"
        />
      ) : reinvestments.length === 0 ? (
        <EmptyState
          icon={Sprout}
          title="Դեռ վերաներդրումներ չկան"
          description="Գրանցեք, թե ինչի համար, որ ապրանքի մեջ և որքան գումար եք ներդրել բիզնեսի մեջ։"
        />
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-3xl bg-apricot p-5 shadow-soft">
              <dt className="text-sm font-medium">Ընդհանուր ներդրված</dt>
              <dd className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">
                {formatMoney(total)}
              </dd>
            </div>
            {REINVESTMENT_STATUSES.map((status) => {
              const items = reinvestments.filter((item) => item.status === status);
              return (
                <div key={status} className="rounded-3xl bg-card p-5 shadow-soft">
                  <dt className="text-sm text-muted-foreground">
                    {REINVESTMENT_STATUS_LABELS[status]}
                  </dt>
                  <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                    {formatMoney(items.reduce((sum, item) => sum + item.amount, 0))}
                  </dd>
                  <dd className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                    {formatNumber(items.length)} գրառում
                  </dd>
                </div>
              );
            })}
          </dl>

          <div className="overflow-hidden rounded-3xl bg-card p-3 shadow-soft">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-4">Ամսաթիվ</TableHead>
                  <TableHead className="px-4">Ինչի համար</TableHead>
                  <TableHead className="px-4">{ITEM_LABELS[tenant.businessType]}</TableHead>
                  <TableHead className="px-4 text-right">Գումար</TableHead>
                  <TableHead className="px-4">Կարգավիճակ</TableHead>
                  <TableHead className="px-4">
                    <span className="sr-only">Գործողություններ</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reinvestments.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="px-4 tabular-nums">{displayDate(item.date)}</TableCell>
                    <TableCell className="max-w-80 px-4 font-medium whitespace-normal">
                      {item.purpose}
                    </TableCell>
                    <TableCell className="max-w-56 px-4 whitespace-normal">
                      {item.productTitle ?? <span className="text-muted-foreground">Ընդհանուր</span>}
                    </TableCell>
                    <TableCell className="px-4 text-right font-semibold tabular-nums">
                      {formatMoney(item.amount)}
                    </TableCell>
                    <TableCell className="px-4">
                      <ReinvestmentStatusSelect
                        id={item.id}
                        status={item.status}
                        label={item.purpose}
                      />
                    </TableCell>
                    <TableCell className="px-4 text-right">
                      <DeleteReinvestmentDialog
                        id={item.id}
                        summary={`${item.purpose}, ${formatMoney(item.amount)}`}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
