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
import { DailyRevenueChart } from "@/components/dashboard/daily-revenue-chart";
import { RangeFilter } from "@/components/dashboard/range-filter";
import { SourceBreakdown } from "@/components/dashboard/source-breakdown";
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
import { getAnalytics } from "@/lib/analytics/queries";
import { resolveRange } from "@/lib/analytics/range";
import { formatMoney, formatNumber } from "@/lib/format";
import { listInventory } from "@/lib/inventory/queries";
import { hasFeature } from "@/lib/tenant/features";
import { getCurrentTenant } from "@/lib/tenant/get-current-tenant";

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

  const tenant = await getCurrentTenant();
  const isShop = tenant.businessType === "ecommerce";
  const tracksStock = hasFeature(tenant.businessType, "inventory");
  const range = resolveRange({
    range: pick(params.range),
    from: pick(params.from),
    to: pick(params.to),
  });
  const today = resolveRange({ range: "today" }).to;

  const [{ analytics, error }, inventory] = await Promise.all([
    getAnalytics(tenant.id, range),
    tracksStock
      ? listInventory(tenant.id)
      : Promise.resolve({ rows: [], error: null }),
  ]);

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
          {/* Row 1: the numbers that matter most */}
          <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard
              icon={Wallet}
              label="Վաճառք"
              value={formatMoney(analytics.sales)}
              note={`${formatNumber(analytics.totalOrders)} ${isShop ? "պատվեր" : "գրանցում"}${isShop ? `, ${formatNumber(analytics.unitsSold)} հատ` : ""}`}
              emphasis
              tone="accent"
            />
            <KpiCard
              icon={TrendingUp}
              label="Մաքուր շահույթ"
              value={formatMoney(analytics.netProfit)}
              note={
                isShop ? "Վաճառք − ինքնարժեք − մարքեթինգ" : "Վաճառք − մարքեթինգ"
              }
              negative={analytics.netProfit < 0}
              emphasis
            />
            <KpiCard
              icon={ShoppingCart}
              label="Միջին պատվերի արժեք"
              value={formatMoney(analytics.averageOrder)}
              emphasis
              tone="peach"
            />
            <KpiCard
              icon={Percent}
              label="Շահութաբերություն"
              value={
                analytics.profitMargin === null
                  ? "—"
                  : `${oneDecimal(analytics.profitMargin)}%`
              }
              negative={(analytics.profitMargin ?? 0) < 0}
              emphasis
              tone="sky"
            />
          </dl>

          {/* Row 2: efficiency */}
          <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard
              icon={Megaphone}
              label="ROAS"
              value={
                analytics.roas === null
                  ? "—"
                  : `${formatNumber(Math.round(analytics.roas * 100) / 100)}×`
              }
              note={
                analytics.roas === null
                  ? "Մարքեթինգի ծախս չկա"
                  : "Վաճառքը՝ մարքեթինգի 1 ֏-ի դիմաց"
              }
            />
            <KpiCard
              icon={UserPlus}
              label="CAC"
              value={analytics.cac === null ? "—" : formatMoney(analytics.cac)}
              note={`Մարքեթինգի ծախսը՝ 1 ${isShop ? "պատվերի" : "գրանցման"} համար`}
            />
            <KpiCard
              icon={Receipt}
              label="Ինքնարժեք"
              value={formatMoney(analytics.variableCosts)}
              note={
                analytics.contributionMargin === null
                  ? "Ապրանք + նյութեր"
                  : `Մարժինալ շահույթ՝ ${oneDecimal(analytics.contributionMargin)}%`
              }
            />
            <KpiCard
              icon={Receipt}
              label="Մարքեթինգ"
              value={formatMoney(analytics.marketingSpend)}
              note={`Այլ ծախսեր՝ ${formatMoney(analytics.otherExpenses)} (առանձին)`}
            />
          </dl>

          <BreakEvenCard
            breakEven={analytics.breakEven}
            fixedCosts={analytics.marketingSpend}
            contribution={analytics.contribution}
            unitsSold={analytics.unitsSold}
            unitLabel={isShop ? "հատ" : "գրանցում"}
          />

          {/* Row 3: product performance | stock and marketing */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel
              title={isShop ? "Ապրանքների արդյունքը" : "Դասընթացների արդյունքը"}
              flush
            >
              {analytics.products.length === 0 ? (
                <Empty />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="px-4">
                        {isShop ? "Ապրանք" : "Դասընթաց"}
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
                    <ul className="divide-y divide-border/70 px-2 text-sm">
                      {inventory.rows.map((row) => (
                        <li
                          key={row.productId}
                          className="flex items-center justify-between gap-4 py-3"
                        >
                          <span className="min-w-0 truncate">{row.title}</span>
                          <span
                            className={cn(
                              "shrink-0 font-semibold tabular-nums",
                              row.available === 0 && "text-destructive",
                            )}
                          >
                            {row.available === 0
                              ? "Սպառված է"
                              : formatNumber(row.available)}
                          </span>
                        </li>
                      ))}
                    </ul>
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
                {analytics.personalExpenses > 0 && (
                  <Line
                    label="Անձնական ծախսեր"
                    amount={-analytics.personalExpenses}
                  />
                )}
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

function displayShortDate(date: string) {
  const [, month, day] = date.split("-");
  return `${day}.${month}`;
}

/**
 * Break-even: how much of the period's fixed costs the contribution margin
 * has covered, and the day it reached zero (or what is still missing).
 */
function BreakEvenCard({
  breakEven,
  fixedCosts,
  contribution,
  unitsSold,
  unitLabel,
}: {
  breakEven: {
    date: string | null;
    contributionPerUnit: number | null;
    unitsNeeded: number | null;
    remaining: number;
    progress: number;
  };
  fixedCosts: number;
  contribution: number;
  unitsSold: number;
  unitLabel: string;
}) {
  const reached = fixedCosts > 0 && contribution >= fixedCosts;
  const unitsLeft =
    !reached &&
    breakEven.contributionPerUnit &&
    breakEven.contributionPerUnit > 0
      ? Math.ceil(breakEven.remaining / breakEven.contributionPerUnit)
      : null;

  return (
    <section className="rounded-3xl bg-card p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Զրոյական կետ</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Երբ վաճառքից ստացված մարժինալ շահույթը ծածկում է մարքեթինգի ծախսը,
            բիզնեսը դուրս է գալիս զրոյի, և ամեն հաջորդ վաճառքը արդեն մաքուր
            շահույթ է։
          </p>
        </div>
        <p
          className={cn(
            "rounded-full px-3 py-1.5 text-sm font-semibold",
            fixedCosts === 0
              ? "bg-muted text-muted-foreground"
              : reached
                ? "bg-emerald-100 text-emerald-900"
                : "bg-amber-100 text-amber-900",
          )}
        >
          {fixedCosts === 0
            ? "Մարքեթինգի ծախս չկա"
            : reached
              ? breakEven.date
                ? `Հասավ ${displayShortDate(breakEven.date)}-ին`
                : "Հասավ"
              : "Դեռ չի հասել"}
        </p>
      </div>

      {fixedCosts > 0 && (
        <>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "source-bar h-full rounded-full",
                reached ? "bg-emerald-500" : "bg-ring",
              )}
              style={{ width: `${breakEven.progress * 100}%` }}
            />
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">Մարքեթինգ</dt>
              <dd className="mt-0.5 font-semibold tabular-nums">
                {formatMoney(fixedCosts)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Ծածկված</dt>
              <dd className="mt-0.5 font-semibold tabular-nums">
                {formatMoney(Math.max(Math.min(contribution, fixedCosts), 0))} (
                {Math.round(breakEven.progress * 100)}%)
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">
                {reached ? "Զրոյից վեր" : "Մնում է"}
              </dt>
              <dd
                className={cn(
                  "mt-0.5 font-semibold tabular-nums",
                  reached && "text-emerald-700",
                )}
              >
                {reached
                  ? formatMoney(contribution - fixedCosts)
                  : `${formatMoney(breakEven.remaining)}${unitsLeft !== null ? ` · ≈${formatNumber(unitsLeft)} ${unitLabel}` : ""}`}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Պետք է վաճառել</dt>
              <dd className="mt-0.5 font-semibold tabular-nums">
                {breakEven.unitsNeeded === null
                  ? "—"
                  : `${formatNumber(breakEven.unitsNeeded)} ${unitLabel}`}
                <span className="ml-1 font-normal text-muted-foreground">
                  (վաճառված՝ {formatNumber(unitsSold)})
                </span>
              </dd>
            </div>
          </dl>
        </>
      )}
    </section>
  );
}

const TONES = {
  accent: "bg-apricot",
  peach: "bg-[#fde8cd]",
  sky: "bg-[#d5f0e3]",
  plain: "bg-card",
};

function KpiCard({
  icon: Icon,
  label,
  value,
  note,
  negative,
  emphasis,
  tone = "plain",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  note?: string;
  negative?: boolean;
  /** Larger figure, for the top row. */
  emphasis?: boolean;
  /** Background tint of the tile. */
  tone?: keyof typeof TONES;
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-3xl p-5 shadow-soft",
        emphasis && "min-h-36",
        TONES[tone],
      )}
    >
      <dt className="flex items-start justify-between gap-3 text-sm font-medium">
        {label}
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full",
            tone === "plain"
              ? "bg-muted"
              : "bg-primary text-primary-foreground",
          )}
        >
          <Icon className="size-4" strokeWidth={1.75} aria-hidden />
        </span>
      </dt>
      <dd
        className={cn(
          "mt-auto pt-3 font-semibold tracking-tight whitespace-nowrap tabular-nums",
          emphasis ? "text-3xl" : "text-2xl",
          negative && "text-destructive",
        )}
      >
        {value}
      </dd>
      {note && (
        <dd
          className={cn(
            "mt-1 text-xs",
            tone === "plain" ? "text-muted-foreground" : "opacity-70",
          )}
        >
          {note}
        </dd>
      )}
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
        "overflow-hidden rounded-3xl bg-card shadow-soft",
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
