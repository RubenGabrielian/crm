// All day boundaries use Armenia time (UTC+4, no daylight saving).
const OFFSET_MS = 4 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export const RANGE_PRESETS = ["today", "yesterday", "7d", "30d"] as const;
export type RangePreset = (typeof RANGE_PRESETS)[number];
export type RangeKey = RangePreset | "custom";

export const RANGE_LABELS: Record<RangePreset, string> = {
  today: "Այսօր",
  yesterday: "Երեկ",
  "7d": "Վերջին 7 օրը",
  "30d": "Վերջին 30 օրը",
};

export type DateRange = {
  key: RangeKey;
  /** Inclusive, as YYYY-MM-DD in Armenia time. */
  from: string;
  to: string;
};

function toDateString(ms: number) {
  return new Date(ms + OFFSET_MS).toISOString().slice(0, 10);
}

export function dateStringOf(iso: string) {
  return toDateString(new Date(iso).getTime());
}

export function addDays(date: string, days: number) {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): string[] {
  const days: string[] = [];
  for (let day = from; day <= to; day = addDays(day, 1)) days.push(day);
  return days;
}

/** Start (inclusive) and end (exclusive) of the range as timestamps for queries. */
export function rangeBounds(range: DateRange) {
  return {
    start: `${range.from}T00:00:00+04:00`,
    end: `${addDays(range.to, 1)}T00:00:00+04:00`,
  };
}

export function resolveRange(
  params: { range?: string; from?: string; to?: string },
  /** Used when no (valid) period is given. */
  fallback: "7d" | "30d" = "7d",
): DateRange {
  const today = toDateString(Date.now());

  if (params.range === "custom" && params.from && params.to) {
    const valid = DATE.test(params.from) && DATE.test(params.to);
    if (valid) {
      // Swap if entered backwards; cap at one year so the page stays fast.
      let [from, to] = params.from <= params.to ? [params.from, params.to] : [params.to, params.from];
      if (to > today) to = today;
      if (from > to) from = to;
      if (addDays(from, 365) < to) from = addDays(to, -365);
      return { key: "custom", from, to };
    }
  }

  const preset = RANGE_PRESETS.includes(params.range as RangePreset) ? params.range : fallback;

  switch (preset) {
    case "today":
      return { key: "today", from: today, to: today };
    case "yesterday":
      return { key: "yesterday", from: addDays(today, -1), to: addDays(today, -1) };
    case "30d":
      return { key: "30d", from: addDays(today, -29), to: today };
    default:
      return { key: "7d", from: addDays(today, -6), to: today };
  }
}
