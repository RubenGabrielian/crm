"use client";

import { useState } from "react";
import { cn } from "cn";
import { formatMoney, formatNumber } from "@/lib/format";

type Source = { name: string | null; orders: number; revenue: number };
type Metric = "orders" | "revenue";

function percent(value: number, total: number) {
  if (total <= 0) return "0%";
  const share = (value / total) * 100;
  return `${formatNumber(share >= 10 ? Math.round(share) : Math.round(share * 10) / 10)}%`;
}

/**
 * Where orders come from, ranked: one bar per source sized by its share,
 * with orders, sales and average order next to it. One hue, because the
 * bar length is the comparison; the leader is drawn solid.
 */
export function SourceBreakdown({
  sources,
  ordersLabel,
}: {
  sources: Source[];
  ordersLabel: string;
}) {
  const [metric, setMetric] = useState<Metric>("orders");
  const total = sources.reduce((sum, source) => sum + source[metric], 0);
  const rows = [...sources].sort((a, b) => b[metric] - a[metric]);
  const max = Math.max(...rows.map((row) => row[metric]), 1);
  const named = sources.filter((source) => source.name !== null);
  const unknown = sources.find((source) => source.name === null);
  const top = [...named].sort((a, b) => b[metric] - a[metric])[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {top ? (
            <>
              Ամենաշատը՝{" "}
              <span className="font-semibold text-foreground">{top.name}</span>,{" "}
              {percent(top[metric], total)}
            </>
          ) : (
            "Աղբյուրները դեռ նշված չեն"
          )}
        </p>
        <div
          role="group"
          aria-label="Ցուցանիշ"
          className="flex rounded-full bg-muted p-1 text-xs font-medium"
        >
          {(["orders", "revenue"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={metric === option}
              onClick={() => setMetric(option)}
              className={cn(
                "rounded-full px-3 py-1.5 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                metric === option && "bg-card text-foreground shadow-soft",
              )}
            >
              {option === "orders" ? ordersLabel : "Վաճառք"}
            </button>
          ))}
        </div>
      </div>

      <ul className="flex flex-col gap-3.5">
        {rows.map((row, index) => (
          <li key={row.name ?? ""} className="grid gap-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span
                className={cn(
                  "min-w-0 truncate",
                  row.name === null ? "text-muted-foreground" : "font-medium",
                )}
              >
                {row.name ?? "Աղբյուրը նշված չէ"}
              </span>
              <span className="flex shrink-0 items-baseline gap-2 tabular-nums">
                <span className="font-semibold">
                  {metric === "orders"
                    ? formatNumber(row.orders)
                    : formatMoney(row.revenue)}
                </span>
                <span className="w-11 text-right text-xs text-muted-foreground">
                  {percent(row[metric], total)}
                </span>
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "source-bar h-full rounded-full",
                  row.name === null
                    ? "bg-muted-foreground/35"
                    : index === 0
                      ? "bg-ring"
                      : "bg-ring/45",
                )}
                style={{ width: `${(row[metric] / max) * 100}%` }}
              />
            </div>
            <p className="text-xs tabular-nums text-muted-foreground">
              {metric === "orders"
                ? `Վաճառք՝ ${formatMoney(row.revenue)}`
                : `${ordersLabel}՝ ${formatNumber(row.orders)}`}
              {row.orders > 0 &&
                `, միջինը՝ ${formatMoney(Math.round(row.revenue / row.orders))}`}
            </p>
          </li>
        ))}
      </ul>

      {unknown && unknown.orders > 0 && (
        <p className="rounded-2xl bg-muted px-4 py-3 text-xs text-muted-foreground">
          {formatNumber(unknown.orders)} {ordersLabel.toLowerCase()}ի աղբյուրը
          նշված չէ։ Նշեք այն պատվերների աղյուսակում, որպեսզի վիճակագրությունը
          լինի ճշգրիտ։
        </p>
      )}
    </div>
  );
}
