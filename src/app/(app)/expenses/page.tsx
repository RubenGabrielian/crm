import Link from "next/link";
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
  isCostType,
  type CostType,
} from "@/config/expenses";
import { resolveRange } from "@/lib/analytics/range";
import { FREE_EXPENSE_LIMIT } from "@/lib/billing/limits";
import { isCurrentUserPro } from "@/lib/billing/subscription";
import {
  countAllExpenses,
  listExpenses,
  listRecurringExpenses,
  monthlyCharges,
} from "@/lib/expenses/queries";
import { formatMoney, formatNumber } from "@/lib/format";
import { requirePermission } from "@/lib/tenant/get-current-tenant";

/** A tile is also a filter: "all" shows every expense. */
type Tile = "all" | CostType;

const TILE_LABELS: Record<Tile, { title: string; note: string }> = {
  all: { title: "Բոլոր ծախսերը", note: "Ֆիքսված և փոփոխական" },
  fixed: { title: "Ֆիքսված ծախսեր", note: "Վճարվում են՝ վաճառք լինի թե ոչ" },
  variable: { title: "Փոփոխական ծախսեր", note: "Աճում են վաճառքի հետ" },
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

  const tenant = await requirePermission("expenses");
  const range = resolveRange(
    { range: pick(params.range), from: pick(params.from), to: pick(params.to) },
    "30d",
  );
  const today = resolveRange({ range: "today" }).to;
  const [{ expenses: oneOff, error }, recurring, isPro] = await Promise.all([
    listExpenses(tenant.id, range),
    listRecurringExpenses(tenant.id),
    isCurrentUserPro(),
  ]);
  // Free accounts can add a couple of expenses; addExpense checks it again.
  const expenseCount = isPro ? null : await countAllExpenses(tenant.id);
  const limitReached =
    expenseCount !== null && expenseCount >= FREE_EXPENSE_LIMIT;
  // One-off entries plus this period's charges from monthly expenses, newest first.
  const expenses = [...oneOff, ...monthlyCharges(recurring, range, today)].sort(
    (a, b) => b.date.localeCompare(a.date),
  );
  // Unpaid expenses stay in the list but are not money spent yet.
  const sum = (items: typeof expenses) =>
    items.reduce((all, item) => all + item.amount, 0);
  const unpaid = expenses.filter((expense) => !expense.paid);
  const paid = expenses.filter((expense) => expense.paid);
  const groups = (["all", "fixed", "variable"] as const).map((group) => {
    const items =
      group === "all"
        ? paid
        : paid.filter((expense) => expense.costType === group);
    return { group, amount: sum(items), count: items.length };
  });

  // Clicking a tile shows only that type; the period stays as it is.
  const typeParam = pick(params.type);
  const filter: Tile = isCostType(typeParam) ? typeParam : "all";
  const shown =
    filter === "all"
      ? expenses
      : expenses.filter((expense) => expense.costType === filter);
  const hrefFor = (tile: Tile) => {
    const query = new URLSearchParams();
    for (const key of ["range", "from", "to"] as const) {
      const value = pick(params[key]);
      if (value) query.set(key, value);
    }
    if (tile !== "all") query.set("type", tile);
    const text = query.toString();
    return text ? `/expenses?${text}` : "/expenses";
  };

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
        <AddExpenseDialog today={today} limitReached={limitReached} />
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
            <nav
              aria-label="Ծախսերի տեսակ"
              className="grid gap-3 sm:grid-cols-3 sm:gap-4"
            >
              {groups.map((tile) => {
                const active = filter === tile.group;
                return (
                  <Link
                    key={tile.group}
                    href={hrefFor(tile.group)}
                    scroll={false}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "rounded-3xl p-5 shadow-soft outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-card hover:bg-muted",
                    )}
                  >
                    <span className="block text-sm font-medium">
                      {TILE_LABELS[tile.group].title}
                    </span>
                    <span className="mt-3 block text-2xl font-semibold tracking-tight tabular-nums">
                      {formatMoney(tile.amount)}
                    </span>
                    <span className="mt-1 block text-xs tabular-nums opacity-70">
                      {formatNumber(tile.count)} գրառում ·{" "}
                      {TILE_LABELS[tile.group].note}
                    </span>
                  </Link>
                );
              })}
            </nav>
            <CostTypeGuide />
            {unpaid.length > 0 && (
              <p className="text-sm tabular-nums text-muted-foreground">
                Չվճարված՝ {formatMoney(sum(unpaid))} (
                {formatNumber(unpaid.length)} գրառում)։ Չի հաշվարկվում վերևի
                գումարներում։
              </p>
            )}
          </div>

          {shown.length === 0 && expenses.length > 0 ? (
            <EmptyState
              icon={Receipt}
              title={`Այս ժամանակահատվածում ${filter === "fixed" ? "ֆիքսված" : "փոփոխական"} ծախսեր չկան`}
              description="Ընտրեք «Բոլոր ծախսերը»՝ ամբողջ ցանկը տեսնելու համար։"
            />
          ) : expenses.length === 0 ? (
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
                  {shown.map((expense) => {
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

/** What counts as fixed and what as variable, with everyday examples. */
function CostTypeGuide() {
  return (
    <details className="rounded-3xl bg-card px-5 py-4 text-sm shadow-soft">
      <summary className="cursor-pointer font-medium outline-none focus-visible:underline">
        Ո՞րն է ֆիքսված ծախս, որը՝ փոփոխական
      </summary>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-muted p-4">
          <p className="font-semibold">Ֆիքսված</p>
          <p className="mt-1 text-muted-foreground">
            Վճարում ես ամեն ամիս՝ վաճառք լինի թե ոչ։ Մեկ պատվեր ունենաս թե հարյուր,
            գումարը նույնն է։
          </p>
          <p className="mt-2 text-muted-foreground">
            Օրինակ՝ վարձ, աշխատավարձ, գովազդի բյուջե, ծրագրերի և ինտերնետի
            վճար, կոմունալ։
          </p>
        </div>
        <div className="rounded-2xl bg-muted p-4">
          <p className="font-semibold">Փոփոխական</p>
          <p className="mt-1 text-muted-foreground">
            Մեծանում է վաճառքի հետ՝ որքան շատ ես վաճառում, այնքան շատ ես
            ծախսում։ Վաճառք չկա՝ ծախս էլ չկա։
          </p>
          <p className="mt-2 text-muted-foreground">
            Օրինակ՝ ապրանքի գնում, փաթեթավորում, տոպրակ ու պիտակ, առաքում,
            բանկի միջնորդավճար։
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Ֆիքսված ծախսերն օգտագործվում են զրոյական կետը հաշվելու համար՝ քանի հատ
        պետք է վաճառես, որ դրանք ծածկվեն։
      </p>
    </details>
  );
}
