"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "cn";
import { formatMoney, formatNumber } from "@/lib/format";

type Day = { date: string; revenue: number; orders: number };
type Metric = "revenue" | "orders";
type Bucket = {
  key: string;
  label: string;
  tick: string;
  revenue: number;
  orders: number;
};

const MONTHS = [
  "Հունվար",
  "Փետրվար",
  "Մարտ",
  "Ապրիլ",
  "Մայիս",
  "Հունիս",
  "Հուլիս",
  "Օգոստոս",
  "Սեպտեմբեր",
  "Հոկտեմբեր",
  "Նոյեմբեր",
  "Դեկտեմբեր",
];
const MONTHS_SHORT = [
  "հնվ",
  "փտր",
  "մրտ",
  "ապր",
  "մյս",
  "հնս",
  "հլս",
  "օգս",
  "սեպ",
  "հոկ",
  "նոյ",
  "դեկ",
];

const HEIGHT = 260;
const PAD = { top: 16, right: 12, bottom: 28, left: 52 };

function shortDate(date: string) {
  const [, month, day] = date.split("-");
  return `${day}.${month}`;
}

function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Day by day for short periods, by week up to ~7 months, by month beyond. */
function bucketize(days: Day[]): {
  buckets: Bucket[];
  unit: "day" | "week" | "month";
} {
  const unit =
    days.length <= 45 ? "day" : days.length <= 210 ? "week" : "month";
  const map = new Map<string, Bucket>();
  for (const day of days) {
    let key = day.date;
    let label = shortDate(day.date);
    let tick = label;
    if (unit === "week") {
      // Weeks start on Monday.
      const weekday = (new Date(`${day.date}T00:00:00Z`).getUTCDay() + 6) % 7;
      key = addDays(day.date, -weekday);
      label = `${shortDate(key)}–${shortDate(addDays(key, 6))}`;
      tick = shortDate(key);
    } else if (unit === "month") {
      const [year, month] = day.date.split("-");
      key = `${year}-${month}`;
      label = `${MONTHS[Number(month) - 1]} ${year}`;
      tick = MONTHS_SHORT[Number(month) - 1];
    }
    const bucket = map.get(key) ?? { key, label, tick, revenue: 0, orders: 0 };
    bucket.revenue += day.revenue;
    bucket.orders += day.orders;
    map.set(key, bucket);
  }
  return { buckets: [...map.values()], unit };
}

/** A round axis maximum and step: 0, 50 000, 100 000, … */
function niceScale(max: number, ticks = 4) {
  if (max <= 0) return { top: ticks, step: 1 };
  const raw = max / ticks;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step =
    [1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => s >= raw) ?? raw;
  return { top: step * Math.ceil(max / step), step };
}

function compact(value: number, metric: Metric) {
  if (metric === "orders") return formatNumber(value);
  if (value >= 1_000_000)
    return `${formatNumber(Math.round(value / 100_000) / 10)} մլն`;
  if (value >= 1_000)
    return `${formatNumber(Math.round(value / 100) / 10)} հզ.`;
  return formatNumber(value);
}

/** Smooth line through the points that never overshoots them (monotone cubic). */
function smoothPath(points: [number, number][]) {
  const n = points.length;
  if (n < 2) return "";
  const dx = points.slice(1).map((p, i) => p[0] - points[i][0]);
  const slope = points.slice(1).map((p, i) => (p[1] - points[i][1]) / dx[i]);
  const tangent = points.map((_, i) => {
    if (i === 0) return slope[0];
    if (i === n - 1) return slope[n - 2];
    return slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2;
  });
  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) {
      tangent[i] = 0;
      tangent[i + 1] = 0;
      continue;
    }
    const a = tangent[i] / slope[i];
    const b = tangent[i + 1] / slope[i];
    const h = a * a + b * b;
    if (h > 9) {
      const t = 3 / Math.sqrt(h);
      tangent[i] = t * a * slope[i];
      tangent[i + 1] = t * b * slope[i];
    }
  }
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const third = dx[i] / 3;
    d += ` C${x0 + third},${y0 + tangent[i] * third} ${x1 - third},${y1 - tangent[i + 1] * third} ${x1},${y1}`;
  }
  return d;
}

const UNIT_LABEL = {
  day: "օրական",
  week: "շաբաթական",
  month: "ամսական",
} as const;

export function DailyRevenueChart({
  days,
  ordersLabel,
}: {
  days: Day[];
  ordersLabel: string;
}) {
  const [metric, setMetric] = useState<Metric>("revenue");
  const [active, setActive] = useState<number | null>(null);
  const [width, setWidth] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const gradientId = useId();

  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const { buckets, unit } = useMemo(() => bucketize(days), [days]);
  const values = buckets.map((bucket) => bucket[metric]);
  const total = values.reduce((sum, value) => sum + value, 0);
  const average = buckets.length ? total / buckets.length : 0;
  const bestIndex = values.indexOf(Math.max(...values, 0));
  const format = (value: number) =>
    metric === "revenue" ? formatMoney(value) : formatNumber(value);

  const totalRevenue = days.reduce((sum, day) => sum + day.revenue, 0);
  if (totalRevenue === 0 && days.every((day) => day.orders === 0)) {
    return (
      <p className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Այս ժամանակահատվածում վաճառք չկա։
      </p>
    );
  }

  const { top, step } = niceScale(Math.max(...values, 0));
  const innerW = Math.max(width - PAD.left - PAD.right, 0);
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const x = (i: number) =>
    PAD.left +
    (buckets.length === 1 ? innerW / 2 : (i / (buckets.length - 1)) * innerW);
  const y = (value: number) => PAD.top + innerH - (value / top) * innerH;
  const points = values.map((value, i) => [x(i), y(value)] as [number, number]);
  const line = smoothPath(points);
  const area = line
    ? `${line} L${x(buckets.length - 1)},${PAD.top + innerH} L${x(0)},${PAD.top + innerH} Z`
    : "";
  const gridValues = Array.from(
    { length: Math.round(top / step) + 1 },
    (_, i) => i * step,
  );
  // About one date label per 90px, always including the first and last.
  const labelEvery = Math.max(
    1,
    Math.ceil(buckets.length / Math.max(innerW / 90, 1)),
  );

  function pick(clientX: number) {
    const rect = box.current?.getBoundingClientRect();
    if (!rect || buckets.length === 0) return;
    const ratio = (clientX - rect.left - PAD.left) / Math.max(innerW, 1);
    setActive(
      Math.min(
        Math.max(Math.round(ratio * (buckets.length - 1)), 0),
        buckets.length - 1,
      ),
    );
  }

  const shown = active ?? null;
  const tooltipLeft =
    shown === null ? 0 : Math.min(Math.max(x(shown), 80), width - 80);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <dl className="flex flex-wrap gap-x-8 gap-y-2">
          <div>
            <dt className="text-xs text-muted-foreground">Ընդամենը</dt>
            <dd className="mt-0.5 text-xl font-semibold tracking-tight tabular-nums">
              {format(total)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">
              Միջինը՝ {UNIT_LABEL[unit]}
            </dt>
            <dd className="mt-0.5 text-xl font-semibold tracking-tight tabular-nums">
              {metric === "revenue"
                ? formatMoney(Math.round(average))
                : formatNumber(Math.round(average * 10) / 10)}
            </dd>
          </div>
          {buckets.length > 1 && values[bestIndex] > 0 && (
            <div>
              <dt className="text-xs text-muted-foreground">Լավագույնը</dt>
              <dd className="mt-0.5 text-xl font-semibold tracking-tight tabular-nums">
                {format(values[bestIndex])}
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  {buckets[bestIndex].label}
                </span>
              </dd>
            </div>
          )}
        </dl>

        <div
          role="group"
          aria-label="Ցուցանիշ"
          className="flex rounded-full bg-muted p-1 text-xs font-medium"
        >
          {(["revenue", "orders"] as const).map((option) => (
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
              {option === "revenue" ? "Վաճառք" : ordersLabel}
            </button>
          ))}
        </div>
      </div>

      <div ref={box} className="relative" style={{ height: HEIGHT }}>
        {width > 0 && (
          <svg
            width={width}
            height={HEIGHT}
            role="img"
            aria-label={`${metric === "revenue" ? "Վաճառք" : ordersLabel}՝ ${UNIT_LABEL[unit]}, ընդամենը ${format(total)}`}
            tabIndex={0}
            className="overflow-visible rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onPointerMove={(event) => pick(event.clientX)}
            onPointerDown={(event) => pick(event.clientX)}
            onPointerLeave={() => setActive(null)}
            onBlur={() => setActive(null)}
            onKeyDown={(event) => {
              if (event.key !== "ArrowLeft" && event.key !== "ArrowRight")
                return;
              event.preventDefault();
              const delta = event.key === "ArrowRight" ? 1 : -1;
              setActive((current) =>
                Math.min(
                  Math.max(
                    (current ?? (delta > 0 ? -1 : buckets.length)) + delta,
                    0,
                  ),
                  buckets.length - 1,
                ),
              );
            }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--ring)" stopOpacity="0.28" />
                <stop offset="100%" stopColor="var(--ring)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Recessive grid and value labels */}
            {gridValues.map((value) => (
              <g key={value}>
                <line
                  x1={PAD.left}
                  x2={PAD.left + innerW}
                  y1={y(value)}
                  y2={y(value)}
                  stroke="var(--border)"
                  strokeDasharray={value === 0 ? undefined : "3 4"}
                />
                <text
                  x={PAD.left - 10}
                  y={y(value)}
                  dy="0.32em"
                  textAnchor="end"
                  className="fill-muted-foreground text-[11px] tabular-nums"
                >
                  {compact(value, metric)}
                </text>
              </g>
            ))}

            {/* Date labels */}
            {buckets.map((bucket, i) =>
              i % labelEvery === 0 || i === buckets.length - 1 ? (
                i !== buckets.length - 1 &&
                buckets.length - 1 - i < labelEvery / 2 ? null : (
                  <text
                    key={bucket.key}
                    x={x(i)}
                    y={HEIGHT - 6}
                    textAnchor={
                      buckets.length === 1
                        ? "middle"
                        : i === 0
                          ? "start"
                          : i === buckets.length - 1
                            ? "end"
                            : "middle"
                    }
                    className="fill-muted-foreground text-[11px] tabular-nums"
                  >
                    {bucket.tick}
                  </text>
                )
              ) : null,
            )}

            {/* Average */}
            {buckets.length > 1 && average > 0 && (
              <g>
                <line
                  x1={PAD.left}
                  x2={PAD.left + innerW}
                  y1={y(average)}
                  y2={y(average)}
                  stroke="var(--muted-foreground)"
                  strokeOpacity="0.55"
                  strokeDasharray="6 5"
                />
                <text
                  x={PAD.left + innerW}
                  y={y(average) - 6}
                  textAnchor="end"
                  paintOrder="stroke"
                  stroke="var(--card)"
                  strokeWidth={4}
                  strokeLinejoin="round"
                  className="fill-muted-foreground text-[11px]"
                >
                  Միջինը
                </text>
              </g>
            )}

            {/* The series */}
            {buckets.length > 1 ? (
              <g key={metric} className="chart-draw">
                <path d={area} fill={`url(#${gradientId})`} />
                <path
                  d={line}
                  fill="none"
                  stroke="var(--ring)"
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                  className="chart-line"
                />
              </g>
            ) : (
              <circle
                cx={x(0)}
                cy={y(values[0])}
                r={6}
                fill="var(--ring)"
                stroke="var(--card)"
                strokeWidth="2"
              />
            )}

            {/* Hover crosshair and marker */}
            {shown !== null && (
              <g pointerEvents="none">
                <line
                  x1={x(shown)}
                  x2={x(shown)}
                  y1={PAD.top}
                  y2={PAD.top + innerH}
                  stroke="var(--foreground)"
                  strokeOpacity="0.18"
                />
                <circle
                  cx={x(shown)}
                  cy={y(values[shown])}
                  r={6}
                  fill="var(--ring)"
                  stroke="var(--card)"
                  strokeWidth="2.5"
                />
              </g>
            )}

            {/* Hit area larger than the line */}
            <rect
              x={PAD.left}
              y={0}
              width={innerW}
              height={HEIGHT}
              fill="transparent"
            />
          </svg>
        )}

        {shown !== null && (
          <div
            role="status"
            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-xl bg-foreground px-3 py-2 text-xs whitespace-nowrap text-background shadow-lg"
            style={{
              left: tooltipLeft,
              top:
                y(values[shown]) - 84 < -8
                  ? y(values[shown]) + 16
                  : y(values[shown]) - 84,
            }}
          >
            <span className="block opacity-75">{buckets[shown].label}</span>
            <span className="mt-0.5 block text-sm font-semibold tabular-nums">
              {formatMoney(buckets[shown].revenue)}
            </span>
            <span className="block tabular-nums opacity-75">
              {ordersLabel}՝ {formatNumber(buckets[shown].orders)}
            </span>
          </div>
        )}
      </div>

      {/* The same data as a table, for screen readers. */}
      <table className="sr-only">
        <caption>Վաճառքն ըստ ժամանակի</caption>
        <thead>
          <tr>
            <th>Ժամանակ</th>
            <th>Վաճառք</th>
            <th>{ordersLabel}</th>
          </tr>
        </thead>
        <tbody>
          {buckets.map((bucket) => (
            <tr key={bucket.key}>
              <td>{bucket.label}</td>
              <td>{formatMoney(bucket.revenue)}</td>
              <td>{formatNumber(bucket.orders)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
