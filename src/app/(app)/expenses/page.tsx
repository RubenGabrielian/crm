import { connection } from "next/server";
import { Receipt, TriangleAlert } from "lucide-react";
import { cn } from "cn";
import { RangeFilter } from "@/components/dashboard/range-filter";
import {
  AddExpenseDialog,
  DeleteExpenseDialog,
  RemoveMonthlyExpenseDialog,
} from "@/components/expenses/expense-dialogs";
import { ExpenseCostTypeSelect } from "@/components/expenses/expense-cost-type-select";
import { ExpensePaidSelect } from "@/components/expenses/expense-paid-select";
import { EmptyState } from "@/components/layout/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  expenseCategoryLabel,
  COST_TYPE_LABELS,
  expenseGroup,
} from "@/config/expenses";
import { resolveRange } from "@/lib/analytics/range";
import {
  listExpenses,
  listRecurringExpenses,
  monthlyCharges,
} from "@/lib/expenses/queries";
import { formatMoney, formatNumber } from "@/lib/format";
import { getCurrentTenant } from "@/lib/tenant/get-current-tenant";

type Tile = "fixed" | "variable" | "personal";

const TILE_LABELS: Record<Tile, { title: string; note: string }> = {
  fixed: { title: "Ֆիքսված ծախսեր", note: "Վճարվում են՝ վաճառք լինի թե ոչ" },
  variable: { title: "Փոփոխական ծախսեր", note: "Աճում են վաճառքի հետ" },
  personal: { title: "Անձնական ծախսեր", note: "Բիզնեսի հաշվարկից դուրս" },
};

function displayDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}.${month}.${year}`;
}

// Reads live data for the current tenant on every request.
export const instant = false;

export default async function ExpensesPage({
  searchParams,
}: PageProps<"/expenses">) {
  // The period depends on today's date, so this page is always rendered per request.
  await connection();
  const params = await searchParams;
  const pick = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const tenant = await getCurrentTenant();
  const range = resolveRange(
    { range: pick(params.range), from: pick(params.from), to: pick(params.to) },
    "30d",
  );
  const today = resolveRange({ range: "today" }).to;
  const [{ expenses: oneOff, error }, recurring] = await Promise.all([
    listExpenses(tenant.id, range),
    listRecurringExpenses(tenant.id),
  ]);
  // One-off entries plus this period's charges from monthly expenses, newest first.
  const expenses = [...oneOff, ...monthlyCharges(recurring, range, today)].sort(
    (a, b) => b.date.localeCompare(a.date),
  );
  // Unpaid expenses stay in the list but are not money spent yet.
  const sum = (items: typeof expenses) =>
    items.reduce((all, item) => all + item.amount, 0);
  const unpaid = expenses.filter((expense) => !expense.paid);
  const paid = expenses.filter((expense) => expense.paid);
  const tileOf = (expense: (typeof expenses)[number]): Tile =>
    expenseGroup(expense.category) === "personal"
      ? "personal"
      : expense.costType;
  const groups = (["fixed", "variable", "personal"] as const)
    .map((group) => {
      const items = paid.filter((expense) => tileOf(expense) === group);
      return { group, amount: sum(items), count: items.length };
    })
    // Personal spending only appears once there is some.
    .filter((tile) => tile.group !== "personal" || tile.count > 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <RangeFilter range={range} today={today} path="/expenses" />
          <p className="text-sm tabular-nums text-muted-foreground">
            {range.from === range.to
              ? displayDate(range.from)
              : `${displayDate(range.from)} – ${displayDate(range.to)}`}
          </p>
        </div>
        <AddExpenseDialog today={today} />
      </div>

      {error ? (
        <EmptyState
          icon={TriangleAlert}
          title="Չհաջողվեց բեռնել տվյալները"
          description="Ստուգեք կապը տվյալների բազայի հետ և թարմացրեք էջը։"
        />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {groups.map((tile) => (
                <div
                  key={tile.group}
                  className={cn(
                    "rounded-3xl p-5 shadow-soft",
                    tile.group === "fixed" ? "bg-apricot" : "bg-card",
                  )}
                >
                  <dt className="text-sm font-medium">
                    {TILE_LABELS[tile.group].title}
                  </dt>
                  <dd className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">
                    {formatMoney(tile.amount)}
                  </dd>
                  <dd className="mt-1 text-xs tabular-nums opacity-70">
                    {formatNumber(tile.count)} գրառում ·{" "}
                    {TILE_LABELS[tile.group].note}
                  </dd>
                </div>
              ))}
            </dl>
            {unpaid.length > 0 && (
              <p className="text-sm tabular-nums text-muted-foreground">
                Չվճարված՝ {formatMoney(sum(unpaid))} (
                {formatNumber(unpaid.length)} գրառում)։ Չի հաշվարկվում վերևի
                գումարներում։
              </p>
            )}
          </div>

          {expenses.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="Այս ժամանակահատվածում ծախսեր չկան"
              description="Ավելացրեք մարքեթինգի, նյութերի, փաթեթավորման և այլ ծախսերը, որպեսզի մաքուր շահույթը ճիշտ հաշվարկվի։"
            />
          ) : (
            <div className="overflow-hidden rounded-3xl bg-card p-3 shadow-soft">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="px-4">Ամսաթիվ</TableHead>
                    <TableHead className="px-4">Կատեգորիա</TableHead>
                    <TableHead className="px-4">Նկարագրություն</TableHead>
                    <TableHead className="px-4 text-right">Գումար</TableHead>
                    <TableHead className="px-4">Տեսակ</TableHead>
                    <TableHead className="px-4">Կարգավիճակ</TableHead>
                    <TableHead className="px-4">
                      <span className="sr-only">Գործողություններ</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => {
                    const category = expenseCategoryLabel(expense.category);
                    return (
                      <TableRow key={expense.id}>
                        <TableCell className="px-4 tabular-nums">
                          {displayDate(expense.date)}
                        </TableCell>
                        <TableCell className="px-4 font-medium">
                          {category}
                          {expense.monthly && (
                            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                              Ամսական
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-80 px-4 whitespace-normal text-muted-foreground">
                          {expense.description ?? "—"}
                        </TableCell>
                        <TableCell
                          className={`px-4 text-right font-semibold tabular-nums ${expense.paid ? "" : "text-muted-foreground"}`}
                        >
                          {formatMoney(expense.amount)}
                        </TableCell>
                        <TableCell className="px-4">
                          {expense.monthly ? (
                            <span className="text-xs text-muted-foreground">
                              {COST_TYPE_LABELS[expense.costType]}
                            </span>
                          ) : (
                            <ExpenseCostTypeSelect
                              expenseId={expense.id}
                              costType={expense.costType}
                              label={`${category}, ${formatMoney(expense.amount)}`}
                            />
                          )}
                        </TableCell>
                        <TableCell className="px-4">
                          {expense.monthly ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <ExpensePaidSelect
                              expenseId={expense.id}
                              paid={expense.paid}
                              label={`${category}, ${formatMoney(expense.amount)}`}
                            />
                          )}
                        </TableCell>
                        <TableCell className="px-4 text-right">
                          {!expense.monthly && (
                            <DeleteExpenseDialog
                              expenseId={expense.id}
                              summary={`${category}, ${formatMoney(expense.amount)}, ${displayDate(expense.date)}`}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {recurring.length > 0 && (
            <section className="overflow-hidden rounded-3xl bg-card p-3 shadow-soft">
              <h2 className="px-2 pt-2 pb-3 text-base font-semibold">
                Ամսական ծախսեր
              </h2>
              <div>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="px-4">Կատեգորիա</TableHead>
                      <TableHead className="px-4">Նկարագրություն</TableHead>
                      <TableHead className="px-4">Ժամկետ</TableHead>
                      <TableHead className="px-4 text-right">
                        Ամսական գումար
                      </TableHead>
                      <TableHead className="px-4">
                        <span className="sr-only">Գործողություններ</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recurring.map((item) => {
                      const category = expenseCategoryLabel(item.category);
                      const stopped =
                        item.endDate !== null && item.endDate < today;
                      return (
                        <TableRow
                          key={item.id}
                          className={
                            stopped ? "text-muted-foreground" : undefined
                          }
                        >
                          <TableCell className="px-4 font-medium">
                            {category}
                          </TableCell>
                          <TableCell className="max-w-80 px-4 whitespace-normal text-muted-foreground">
                            {item.description ?? "—"}
                          </TableCell>
                          <TableCell className="px-4 tabular-nums">
                            {displayDate(item.startDate)}-ից
                            {item.endDate &&
                              ` մինչև ${displayDate(item.endDate)}`}
                            {stopped && (
                              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                                Դադարեցված
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="px-4 text-right font-semibold tabular-nums">
                            {formatMoney(item.amount)}
                          </TableCell>
                          <TableCell className="px-4 text-right">
                            <RemoveMonthlyExpenseDialog
                              recurringId={item.id}
                              summary={`${category}, ${formatMoney(item.amount)} ամսական`}
                              today={today}
                              stopped={stopped}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
