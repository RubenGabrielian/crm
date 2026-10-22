import Link from "next/link";
import { ArrowDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "cn";
import type { OrderStatus } from "@/config/orders";
import { formatMoney, formatNumber } from "@/lib/format";
import {
  MONTH_NAMES,
  WEEKDAYS_SHORT,
  dayKey,
  daysInMonth,
  weekdayIndex,
  type Ymd,
} from "@/lib/orders/calendar";

export type DaySummary = {
  count: number;
  total: number;
  byStatus: Record<OrderStatus, number>;
  /** First few customer names, for a peek inside the cell. */
  names: string[];
};

// Each week row gets a share of the screen height, so the calendar plus the
// top of the selected day's orders fit without scrolling (within limits).
const CELL_HEIGHT = "h-[clamp(3.25rem,calc((100dvh-24rem)/6),6.5rem)]";

export const STATUS_DOT: Record<OrderStatus, string> = {
  new: "bg-amber-400",
  preorder: "bg-violet-500",
  confirmed: "bg-blue-500",
  completed: "bg-emerald-500",
};

/** Month grid; every day links to itself, so the page renders that day's orders. */
export function OrdersCalendar({
  month,
  today,
  selected,
  days,
  statusLabels,
  hrefFor,
  selectedCount = 0,
}: {
  month: { year: number; month: number };
  today: Ymd;
  selected: Ymd | null;
  days: Map<string, DaySummary>;
  statusLabels: Record<OrderStatus, string>;
  hrefFor: (target: { month?: { year: number; month: number }; day?: Ymd | null }) => string;
  /** Orders on the selected day, for the "jump to orders" button. */
  selectedCount?: number;
}) {
  const count = daysInMonth(month);
  const lead = weekdayIndex({ ...month, day: 1 });
  const cells: (Ymd | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: count }, (_, i) => ({ ...month, day: i + 1 })),
  ];
  while (cells.length % 7) cells.push(null);

  const busiest = Math.max(1, ...[...days.values()].map((d) => d.count));
  const monthOrders = [...days.values()].reduce((t, d) => t + d.count, 0);
  const monthTotal = [...days.values()].reduce((t, d) => t + d.total, 0);
  const isToday = (d: Ymd) => dayKey(d) === dayKey(today);
  const isSelected = (d: Ymd) => selected !== null && dayKey(d) === dayKey(selected);
  const isCurrentMonth = month.year === today.year && month.month === today.month;

  const prev = { year: month.month === 1 ? month.year - 1 : month.year, month: month.month === 1 ? 12 : month.month - 1 };
  const next = { year: month.month === 12 ? month.year + 1 : month.year, month: month.month === 12 ? 1 : month.month + 1 };
  const navButton =
    "flex size-9 items-center justify-center rounded-full outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <section className="rounded-3xl bg-card p-3 shadow-soft sm:px-4 sm:pt-3 sm:pb-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1">
        <div className="flex items-center gap-1">
          <Link href={hrefFor({ month: prev })} aria-label="Նախորդ ամիս" className={navButton}>
            <ChevronLeft className="size-4" />
          </Link>
          <h2 className="min-w-40 text-center text-lg font-semibold tracking-tight">
            {MONTH_NAMES[month.month - 1]} {month.year}
          </h2>
          <Link href={hrefFor({ month: next })} aria-label="Հաջորդ ամիս" className={navButton}>
            <ChevronRight className="size-4" />
          </Link>
          {!isCurrentMonth && (
            <Link
              href={hrefFor({ month: today, day: today })}
              className="ml-1 rounded-full border border-border px-3 py-1.5 text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              Այսօր
            </Link>
          )}
        </div>
        <p className="text-sm text-muted-foreground tabular-nums">
          {formatNumber(monthOrders)} պատվեր · {formatMoney(monthTotal)}
        </p>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS_SHORT.map((name, i) => (
          <div
            key={name}
            className={cn(
              "pb-0.5 text-center text-xs font-medium text-muted-foreground",
              i >= 5 && "text-muted-foreground/70",
            )}
          >
            {name}
          </div>
        ))}

        {cells.map((d, index) => {
          if (!d) return <div key={`blank-${index}`} aria-hidden className={CELL_HEIGHT} />;
          const summary = days.get(dayKey(d));
          const heat = summary ? summary.count / busiest : 0;
          const selectedDay = isSelected(d);
          return (
            <Link
              key={dayKey(d)}
              href={hrefFor({ day: d })}
              scroll={false}
              aria-current={selectedDay ? "date" : undefined}
              aria-label={`${d.day} ${MONTH_NAMES[d.month - 1]}${summary ? `, ${summary.count} պատվեր` : ", պատվեր չկա"}`}
              className={cn(
                "group relative flex flex-col gap-0.5 overflow-hidden rounded-xl border p-1.5 text-left outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring sm:px-2 sm:py-1.5",
                CELL_HEIGHT,
                selectedDay
                  ? "border-ring bg-ring/5 ring-1 ring-ring"
                  : "border-border hover:border-ring/50 hover:shadow-sm",
                !summary && !selectedDay && "bg-muted/30",
              )}
            >
              {/* Busier days get a stronger tint. */}
              {summary && !selectedDay && (
                <span
                  aria-hidden
                  className="absolute inset-0 bg-apricot"
                  style={{ opacity: 0.12 + heat * 0.38 }}
                />
              )}
              <span className="relative flex items-start justify-between gap-1">
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums sm:text-sm",
                    isToday(d) && "bg-primary text-primary-foreground",
                  )}
                >
                  {d.day}
                </span>
                {summary && (
                  <span className="rounded-full bg-card px-1.5 py-0.5 text-[11px] font-semibold tabular-nums shadow-sm sm:px-2 sm:text-xs">
                    {summary.count}
                  </span>
                )}
              </span>
              {summary && (
                <>
                  <span className="relative hidden truncate text-xs font-semibold tabular-nums sm:block">
                    {formatMoney(summary.total)}
                  </span>
                  <span className="relative hidden flex-col sm:[@media(min-height:960px)]:flex">
                    {summary.names.slice(0, 2).map((name, i) => (
                      <span key={i} className="truncate text-[11px] text-foreground/70">
                        {name}
                      </span>
                    ))}
                    {summary.count > 2 && (
                      <span className="text-[11px] text-muted-foreground">
                        +{summary.count - 2} ևս
                      </span>
                    )}
                  </span>
                  <span className="relative mt-auto flex gap-0.5">
                    {(Object.keys(STATUS_DOT) as OrderStatus[]).flatMap((status) =>
                      Array.from({ length: Math.min(summary.byStatus[status], 4) }, (_, i) => (
                        <span key={`${status}-${i}`} className={cn("size-1.5 rounded-full", STATUS_DOT[status])} />
                      )),
                    )}
                  </span>
                </>
              )}
            </Link>
          );
        })}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-xs text-muted-foreground">
        {(Object.keys(STATUS_DOT) as OrderStatus[]).map((status) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", STATUS_DOT[status])} />
            {statusLabels[status]}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-apricot/50" />
          Ավելի գունավոր՝ ավելի շատ պատվեր
        </span>
        {selected && selectedCount > 0 && (
          <a
            href="#day-orders"
            className="ml-auto flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowDown className="size-3.5" />
            Օրվա պատվերները · {selectedCount}
          </a>
        )}
      </div>
    </section>
  );
}
