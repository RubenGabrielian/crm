import Link from "next/link";
import { connection } from "next/server";
import {
  Megaphone,
  Percent,
  Receipt,
  ShoppingCart,
  TrendingUp,
  TriangleAlert,
  UserPlus,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import { BreakEvenChart } from "@/components/dashboard/break-even-chart";
import { DailyRevenueChart } from "@/components/dashboard/daily-revenue-chart";
import { RangeFilter } from "@/components/dashboard/range-filter";
import { SourceBreakdown } from "@/components/dashboard/source-breakdown";
import { StockList } from "@/components/dashboard/stock-list";
import { EmptyState } from "@/components/layout/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { expenseCategoryLabel } from "@/config/expenses";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/config/orders";
import { getAnalytics, type Analytics } from "@/lib/analytics/queries";
import { demoAnalytics, demoInventory } from "@/lib/billing/demo-data";
import { isCurrentUserPro } from "@/lib/billing/subscription";
import { resolveRange } from "@/lib/analytics/range";
import { formatMoney, formatNumber } from "@/lib/format";
import { listInventory } from "@/lib/inventory/queries";
import { hasFeature, ITEM_LABELS } from "@/lib/tenant/features";
import { EmployeeHome } from "@/components/dashboard/employee-home";
import { getCurrentMembership } from "@/lib/tenant/get-current-tenant";
import { can } from "@/lib/tenant/permissions";

// Reads live data for the current tenant on every request.
export const instant = false;

function displayDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}.${month}.${year}`;
}

/** One decimal at most: 12.5, 3, 0.4 */
function oneDecimal(value: number) {
  return formatNumber(Math.round(value * 10) / 10);
}

export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  // The period depends on today's date, so this page is always rendered per request.
  await connection();
  const params = await searchParams;
  const pick = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const { tenant, access } = await getCurrentMembership();
  // Open to everyone; people who may not see the money get a work overview.
  if (!can(access, "dashboard")) {
    return <EmployeeHome tenant={tenant} access={access} />;
  }
  const isShop = tenant.businessType !== "service";
  const tracksStock = hasFeature(tenant.businessType, "inventory");
  const range = resolveRange({
    range: pick(params.range),
    from: pick(params.from),
    to: pick(params.to),
  });
  const today = resolveRange({ range: "today" }).to;

  // Free accounts see the page with sample data (ProGate labels it as a demo).
  const isPro = await isCurrentUserPro();
  const [{ analytics, error }, inventory] = isPro
    ? await Promise.all([
        getAnalytics(tenant.id, range),
        tracksStock
          ? listInventory(tenant.id)
          : Promise.resolve({ rows: [], error: null }),
      ])
    : [
        { analytics: demoAnalytics(range, tenant.businessType), error: null },
        { rows: tracksStock ? demoInventory(tenant.businessType) : [], error: null },
      ];

  const ordersLabel = isShop ? "Պատվերներ" : "Գրանցումներ";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <RangeFilter range={range} today={today} />
        <p className="text-sm tabular-nums text-muted-foreground">
          {range.from === range.to
            ? displayDate(range.from)
            : `${displayDate(range.from)} – ${displayDate(range.to)}`}
          {isShop
            ? "։ Վաճառքը՝ բոլոր պատվերների ապրանքների գումարն է՝ առանց առաքման։"
            : "։ Վաճառքը՝ բոլոր գրանցումների գումարն է։"}
        </p>
      </div>

      {error || !analytics ? (
        <EmptyState
          icon={TriangleAlert}
          title="Չհաջողվեց բեռնել տվյալները"
          description="Ստուգեք կապը տվյալների բազայի հետ և թարմացրեք էջը։"
        />
      ) : (
        <>
          {analytics.totalOrders === 0 && <GettingStarted isShop={isShop} isMixed={tenant.businessType === "mixed"} />}

          {/* The path to net profit, read left to right as one equation */}
          <section aria-labelledby="profit-equation" className="flex flex-col gap-3">
            <h2 id="profit-equation" className="text-base font-semibold">
              Որքա՞ն եք վաստակել այս ժամանակահատվածում
            </h2>
            <dl className="grid gap-2 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1.15fr] lg:items-stretch">
              <MoneyStep
                icon={Wallet}
                label="Վաճառք"
                hint={
                  isShop
                    ? "Որքան են վճարել հաճախորդները ապրանքների համար"
                    : "Որքան են վճարել հաճախորդները"
                }
                value={formatMoney(analytics.sales)}
                note={`${formatNumber(analytics.totalOrders)} ${isShop ? "պատվեր" : "գրանցում"}${isShop ? `, ${formatNumber(analytics.unitsSold)} հատ` : ""}`}
              />
              <Operator sign="−" />
              <MoneyStep
                icon={Receipt}
                label="Ինքնարժեք"
                hint={
                  isShop
                    ? "Որքան արժեցան վաճառված ապրանքներն ու փաթեթավորումը"
                    : "Որքան արժեցան օգտագործված նյութերը"
                }
                value={formatMoney(analytics.variableCosts)}
                note={
                  analytics.variableCosts === 0 && analytics.sales > 0
                    ? "Լրացրեք ապրանքների ինքնարժեքը"
                    : undefined
                }
              />
              <Operator sign="−" />
              <MoneyStep
                icon={Megaphone}
                label="Մարքեթինգ"
                hint="Գովազդի, բլոգերների և նմանատիպ ծախսեր"
                value={formatMoney(analytics.marketingSpend)}
                action={
                  analytics.marketingSpend === 0
                    ? { href: "/expenses", label: "Ավելացնել ծախս" }
                    : undefined
                }
              />
              <Operator sign="=" />
              <MoneyStep
                icon={TrendingUp}
                label="Մաքուր շահույթ"
                hint="Ինչ է մնում ձեզ բոլոր հիմնական ծախսերից հետո"
                value={formatMoney(analytics.netProfit)}
                note={
                  analytics.profitMargin === null
                    ? undefined
                    : `Վաճառքի ${oneDecimal(analytics.profitMargin)}%-ը`
                }
                negative={analytics.netProfit < 0}
                result
              />
            </dl>
          </section>

          {/* Secondary numbers, each explained in one plain sentence */}
          <section aria-labelledby="extra-metrics" className="flex flex-col gap-3">
            <h2 id="extra-metrics" className="text-base font-semibold">
              Օգտակար ցուցանիշներ
            </h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                icon={ShoppingCart}
                label={isShop ? "Միջին պատվեր" : "Միջին գրանցում"}
                value={analytics.totalOrders === 0 ? "—" : formatMoney(analytics.averageOrder)}
                explain={
                  analytics.totalOrders === 0
                    ? "Կհաշվվի առաջին պատվերից հետո"
                    : `Մեկ ${isShop ? "պատվերի" : "գրանցման"} միջին գումարը`
                }
              />
              <MetricCard
                icon={Percent}
                label="Շահութաբերություն"
                value={
                  analytics.profitMargin === null
                    ? "—"
                    : `${oneDecimal(analytics.profitMargin)}%`
                }
                negative={(analytics.profitMargin ?? 0) < 0}
                explain={
                  analytics.profitMargin === null
                    ? "Կհաշվվի առաջին վաճառքից հետո"
                    : analytics.profitMargin >= 0
                      ? `Ամեն 100 ֏ վաճառքից ձեզ մնում է ${formatMoney(Math.round(analytics.profitMargin))}`
                      : `Ամեն 100 ֏ վաճառքից կորցնում եք ${formatMoney(Math.round(-analytics.profitMargin))}`
                }
              />
              <MetricCard
                icon={Megaphone}
                label="Գովազդի վերադարձ"
                tag="ROAS"
                value={
                  analytics.roas === null
                    ? "—"
                    : `${formatNumber(Math.round(analytics.roas * 100) / 100)}×`
                }
                explain={
                  analytics.roas === null
                    ? "Ավելացրեք գովազդի ծախսը՝ հաշվելու համար"
                    : `Գովազդին ծախսած 1 ֏-ը բերել է ${formatMoney(Math.round(analytics.roas))} վաճառք`
                }
              />
              <MetricCard
                icon={UserPlus}
                label={`Գովազդը՝ 1 ${isShop ? "պատվերի" : "գրանցման"} համար`}
                tag="CAC"
                value={analytics.cac === null || analytics.marketingSpend === 0 ? "—" : formatMoney(analytics.cac)}
                explain={
                  analytics.marketingSpend === 0
                    ? "Ավելացրեք գովազդի ծախսը՝ հաշվելու համար"
                    : analytics.cac === null
                      ? `Կհաշվվի առաջին ${isShop ? "պատվերից" : "գրանցումից"} հետո`
                      : `Ամեն ${isShop ? "պատվեր" : "գրանցում"} բերելու համար ծախսել եք ${formatMoney(Math.round(analytics.cac))}`
                }
              />
            </dl>
          </section>

          <BreakEvenCard
            breakEven={analytics.breakEven}
            fixedCosts={analytics.fixedCosts}
            contribution={analytics.contribution}
            unitsSold={analytics.unitsSold}
            unitLabel={isShop ? "հատ" : "գրանցում"}
          />

          {/* Row 3: product performance | stock and marketing */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel
              title={
                tenant.businessType === "mixed"
                  ? "Ապրանքների և ծառայությունների արդյունքը"
                  : isShop
                    ? "Ապրանքների արդյունքը"
                    : "Դասընթացների արդյունքը"
              }
              flush
            >
              {analytics.products.length === 0 ? (
                <Empty />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="px-4">
                        {ITEM_LABELS[tenant.businessType]}
                      </TableHead>
                      <TableHead className="px-3 text-right">Քանակ</TableHead>
                      <TableHead className="px-3 text-right">Հասույթ</TableHead>
                      <TableHead className="px-4 text-right">
                        Համախառն շահույթ
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.products.map((row) => (
                      <TableRow key={row.title}>
                        <TableCell className="max-w-48 px-4 font-medium whitespace-normal">
                          {row.title}
                        </TableCell>
                        <TableCell className="px-3 text-right tabular-nums">
                          {formatNumber(row.units)}
                        </TableCell>
                        <TableCell className="px-3 text-right tabular-nums">
                          {formatMoney(row.revenue)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "px-4 text-right font-semibold tabular-nums",
                            row.grossProfit < 0 && "text-destructive",
                          )}
                        >
                          {formatMoney(row.grossProfit)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Panel>

            <div className="flex flex-col gap-4">
              {tracksStock && (
                <Panel title="Առկա քանակ" flush>
                  {inventory.rows.length === 0 ? (
                    <Empty />
                  ) : (
                    <StockList rows={inventory.rows} />
                  )}
                </Panel>
              )}

              <Panel
                title={`Մարքեթինգի ծախս՝ ${formatMoney(analytics.marketingSpend)}`}
                flush
              >
                {analytics.marketingByCategory.length === 0 ? (
                  <Empty text="Այս ժամանակահատվածում մարքեթինգի ծախս չկա։" />
                ) : (
                  <ul className="divide-y divide-border/70 px-2 text-sm">
                    {analytics.marketingByCategory.map((row) => (
                      <li
                        key={row.category}
                        className="flex items-center justify-between gap-4 py-3"
                      >
                        <span>{expenseCategoryLabel(row.category)}</span>
                        <span className="flex items-baseline gap-3 tabular-nums">
                          <span className="text-xs text-muted-foreground">
                            {oneDecimal(
                              (row.amount / analytics.marketingSpend) * 100,
                            )}
                            %
                          </span>
                          <span className="font-semibold">
                            {formatMoney(row.amount)}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>
          </div>

          {/* Row 4: trend and the full path to net profit */}
          <div className="grid gap-4 lg:grid-cols-5">
            <Panel title="Վաճառքի դինամիկա" className="lg:col-span-3">
              <DailyRevenueChart
                days={analytics.daily}
                ordersLabel={ordersLabel}
              />
            </Panel>

            <Panel
              title="Ինչպես է ստացվում մաքուր շահույթը"
              className="lg:col-span-2"
            >
              <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm tabular-nums">
                <Line label="Վաճառք" amount={analytics.sales} />
                {isShop && (
                  <Line label="Ապրանքների ինքնարժեք" amount={-analytics.cogs} />
                )}
                {analytics.materialsCost > 0 && (
                  <Line
                    label="Նյութեր և փաթեթավորում"
                    amount={-analytics.materialsCost}
                  />
                )}
                <Line
                  label="Մարժինալ շահույթ"
                  amount={analytics.contribution}
                  total
                />
                <Line label="Մարքեթինգ" amount={-analytics.marketingSpend} />
                <Line
                  label="Մաքուր շահույթ"
                  amount={analytics.netProfit}
                  total
                  strong
                />
                <Line label="Այլ ծախսեր" amount={-analytics.otherExpenses} />
                <Line
                  label="Մնացորդ բոլոր ծախսերից հետո"
                  amount={analytics.remainingAfterExpenses}
                  total
                />
              </dl>
              {isShop && analytics.deliveryCollected > 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Առաքման վճարները ({formatMoney(analytics.deliveryCollected)})
                  վաճառքում և շահույթում չեն հաշվվում։
                </p>
              )}
            </Panel>
          </div>

          {/* Row 5: where orders come from, and where they stand */}
          <div className="grid gap-4 lg:grid-cols-5">
            <Panel
              title={
                isShop
                  ? "Որտեղից են գալիս պատվերները"
                  : "Որտեղից են գալիս գրանցումները"
              }
              className="lg:col-span-3"
            >
              {analytics.sources.length === 0 ? (
                <Empty />
              ) : (
                <SourceBreakdown
                  sources={analytics.sources}
                  ordersLabel={ordersLabel}
                />
              )}
            </Panel>

            <Panel title="Կարգավիճակներ" className="lg:col-span-2">
              <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm">
                {ORDER_STATUSES.map((status) => (
                  <div key={status} className="contents">
                    <dt className="text-muted-foreground">
                      {ORDER_STATUS_LABELS[tenant.businessType][status]}
                    </dt>
                    <dd className="text-right font-semibold tabular-nums">
                      {formatNumber(analytics.statuses[status] ?? 0)}
                    </dd>
                  </div>
                ))}
              </dl>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}

/** Break-even: when sales cover the period's fixed costs, drawn as a chart. */
function BreakEvenCard({
  breakEven,
  fixedCosts,
  contribution,
  unitsSold,
  unitLabel,
}: {
  breakEven: Analytics["breakEven"];
  fixedCosts: number;
  contribution: number;
  unitsSold: number;
  unitLabel: string;
}) {
  const ready =
    fixedCosts > 0 &&
    breakEven.contributionPerUnit !== null &&
    breakEven.contributionPerUnit > 0;
  const reached = ready && contribution >= fixedCosts;

  return (
    <section className="rounded-xl bg-card p-5 shadow-soft">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Զրոյական կետ</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Քանի {unitLabel} պետք է վաճառել, որ վաճառքը ծածկի բոլոր ծախսերը։
            Դրանից հետո ամեն հաջորդ վաճառքն արդեն մաքուր շահույթ է։
          </p>
        </div>
        {ready && (
          <p
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-semibold",
              reached
                ? "bg-emerald-100 text-emerald-900"
                : "bg-amber-100 text-amber-900",
            )}
          >
            {reached ? "Հասել եք զրոյի" : "Դեռ չի հասել"}
          </p>
        )}
      </div>
      <BreakEvenChart
        breakEven={breakEven}
        fixedCosts={fixedCosts}
        contribution={contribution}
        unitsSold={unitsSold}
        unitLabel={unitLabel}
      />
    </section>
  );
}

/** First visit, or a quiet period: what to do so the numbers fill in. */
function GettingStarted({
  isShop,
  isMixed,
}: {
  isShop: boolean;
  isMixed: boolean;
}) {
  const steps = [
    {
      href: "/catalog",
      title: isMixed
        ? "Ավելացրեք ապրանք կամ ծառայություն"
        : isShop
          ? "Ավելացրեք ապրանք"
          : "Ավելացրեք դասընթաց",
      text: "Գնով և ինքնարժեքով, որ շահույթը ճիշտ հաշվվի",
    },
    {
      href: "/catalog",
      title: "Ուղարկեք հղումը հաճախորդին",
      text: isShop
        ? "Հաճախորդը պատվիրում է, պատվերը հայտնվում է այստեղ"
        : "Հաճախորդը գրանցվում է, գրանցումը հայտնվում է այստեղ",
    },
    {
      href: "/expenses",
      title: "Գրանցեք գովազդի ծախսը",
      text: "Կտեսնեք՝ որքան է բերում գովազդի ամեն դրամը",
    },
  ];
  return (
    <section className="rounded-xl bg-primary p-5 text-primary-foreground shadow-soft sm:p-6">
      <h2 className="text-lg font-semibold">
        Այս ժամանակահատվածում դեռ {isShop ? "պատվեր" : "գրանցում"} չկա
      </h2>
      <p className="mt-1 max-w-2xl text-sm opacity-80">
        Ներքևի թվերը կլրացվեն ինքնաբերաբար։ Սկսելու համար՝
      </p>
      <ol className="mt-4 grid gap-3 sm:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title}>
            <Link
              href={step.href}
              className="flex h-full gap-3 rounded-lg bg-white/10 p-4 outline-none transition-colors hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-apricot"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-apricot text-sm font-semibold text-foreground">
                {index + 1}
              </span>
              <span>
                <span className="block text-sm font-semibold">{step.title}</span>
                <span className="mt-0.5 block text-xs opacity-75">{step.text}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** One term of the profit equation. The last one (`result`) is the answer. */
function MoneyStep({
  icon: Icon,
  label,
  hint,
  value,
  note,
  action,
  negative,
  result,
}: {
  icon: LucideIcon;
  label: string;
  /** What the number means, in everyday words. */
  hint: string;
  value: string;
  note?: string;
  action?: { href: string; label: string };
  negative?: boolean;
  result?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-xl p-5 shadow-soft",
        result ? "bg-primary text-primary-foreground" : "bg-card",
      )}
    >
      <dt>
        <span className="flex items-center gap-2 text-sm font-semibold">
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full",
              result ? "bg-apricot text-foreground" : "bg-muted",
            )}
          >
            <Icon className="size-4" strokeWidth={1.75} aria-hidden />
          </span>
          {label}
        </span>
        <span
          className={cn(
            "mt-2 block text-xs leading-snug",
            result ? "opacity-80" : "text-muted-foreground",
          )}
        >
          {hint}
        </span>
      </dt>
      <dd
        className={cn(
          "mt-auto pt-4 text-2xl font-semibold tracking-tight whitespace-nowrap tabular-nums xl:text-3xl",
          negative && (result ? "text-apricot" : "text-destructive"),
        )}
      >
        {value}
      </dd>
      {note && (
        <dd className={cn("mt-1 text-xs", result ? "opacity-80" : "text-muted-foreground")}>
          {note}
        </dd>
      )}
      {action && (
        <dd className="mt-1">
          <Link
            href={action.href}
            className="text-xs font-semibold text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            {action.label}
          </Link>
        </dd>
      )}
    </div>
  );
}

function Operator({ sign }: { sign: string }) {
  return (
    <div
      aria-hidden
      className="flex items-center justify-center text-2xl font-semibold text-muted-foreground lg:px-0.5"
    >
      <span className="flex size-9 items-center justify-center rounded-full bg-card shadow-soft">
        {sign}
      </span>
    </div>
  );
}

/** A secondary number with a sentence that says what it means right now. */
function MetricCard({
  icon: Icon,
  label,
  tag,
  value,
  explain,
  negative,
}: {
  icon: LucideIcon;
  label: string;
  /** The usual short name, for owners who already know it. */
  tag?: string;
  value: string;
  explain: string;
  negative?: boolean;
}) {
  return (
    <div className="flex flex-col rounded-xl bg-card p-5 shadow-soft">
      <dt className="flex items-start justify-between gap-3 text-sm font-medium">
        <span>
          {label}
          {tag && (
            <span className="ml-1.5 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
              {tag}
            </span>
          )}
        </span>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
          <Icon className="size-4" strokeWidth={1.75} aria-hidden />
        </span>
      </dt>
      <dd
        className={cn(
          "mt-auto pt-3 text-2xl font-semibold tracking-tight whitespace-nowrap tabular-nums",
          negative && "text-destructive",
        )}
      >
        {value}
      </dd>
      <dd className="mt-1 text-xs leading-snug text-muted-foreground">{explain}</dd>
    </div>
  );
}

function Panel({
  title,
  className,
  flush,
  children,
}: {
  title: string;
  className?: string;
  /** No inner padding, for a table or list that runs edge to edge. */
  flush?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl bg-card shadow-soft",
        className,
      )}
    >
      <h2 className="px-5 pt-5 pb-3 text-base font-semibold">{title}</h2>
      <div className={flush ? "px-3 pb-3" : "px-5 pb-5"}>{children}</div>
    </section>
  );
}

function Empty({ text = "Տվյալներ չկան։" }: { text?: string }) {
  return <p className="px-2 py-6 text-sm text-muted-foreground">{text}</p>;
}

function Line({
  label,
  amount,
  total,
  strong,
}: {
  label: string;
  amount: number;
  total?: boolean;
  strong?: boolean;
}) {
  const text = amount < 0 ? `−${formatMoney(-amount)}` : formatMoney(amount);
  const rule = total && "border-t pt-2";
  return (
    <>
      <dt
        className={cn(
          rule,
          total ? "font-medium" : "text-muted-foreground",
          strong && "text-base font-semibold",
        )}
      >
        {label}
      </dt>
      <dd
        className={cn(
          "text-right",
          rule,
          total && "font-medium",
          strong && "text-base font-semibold",
          strong && amount < 0 && "text-destructive",
        )}
      >
        {text}
      </dd>
    </>
  );
}
