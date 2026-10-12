import { formatMoney, formatNumber } from "@/lib/format";

function shortDate(date: string) {
  const [, month, day] = date.split("-");
  return `${day}.${month}`;
}

/** One series (revenue per day), so a single colour and no legend. */
export function DailyRevenueChart({
  days,
  ordersLabel,
}: {
  days: { date: string; revenue: number; orders: number }[];
  ordersLabel: string;
}) {
  const max = Math.max(...days.map((day) => day.revenue), 0);

  if (max === 0) {
    return (
      <p className="flex h-44 items-center justify-center text-sm text-muted-foreground">
        Այս ժամանակահատվածում հասույթ չկա։
      </p>
    );
  }

  return (
    <div>
      <p className="mb-2 text-xs tabular-nums text-muted-foreground">
        Առավելագույնը՝ {formatMoney(max)}
      </p>
      <ol className="flex h-44 items-end gap-1" aria-label="Հասույթն ըստ օրերի">
        {days.map((day) => (
          <li
            key={day.date}
            tabIndex={0}
            className="group relative flex h-full min-w-0 flex-1 items-end justify-center outline-none"
          >
            <span className="sr-only">
              {shortDate(day.date)}՝ {formatMoney(day.revenue)}, {ordersLabel}՝ {day.orders}
            </span>
            <span
              aria-hidden
              className="w-full max-w-9 rounded-full bg-apricot transition-colors group-hover:bg-primary group-focus-visible:bg-primary"
              style={{ height: `${(day.revenue / max) * 100}%`, minHeight: day.revenue > 0 ? 12 : 0 }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded-lg bg-foreground px-2.5 py-1.5 text-xs whitespace-nowrap text-background shadow-md group-hover:block group-focus-visible:block"
            >
              <span className="block font-medium tabular-nums">{formatMoney(day.revenue)}</span>
              <span className="block opacity-80">
                {shortDate(day.date)}, {ordersLabel.toLowerCase()}՝ {formatNumber(day.orders)}
              </span>
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-1.5 flex justify-between text-xs tabular-nums text-muted-foreground">
        <span>{shortDate(days[0].date)}</span>
        {days.length > 1 && <span>{shortDate(days[days.length - 1].date)}</span>}
      </div>
    </div>
  );
}
