// Calendar dates for the orders page, in the clinic's / shop's time zone.
// Armenia has no daylight saving time, so Yerevan is always UTC+4.
const OFFSET_MS = 4 * 60 * 60 * 1000;

export type Ymd = { year: number; month: number; day: number }; // month 1–12

export const MONTH_NAMES = [
  "Հունվար", "Փետրվար", "Մարտ", "Ապրիլ", "Մայիս", "Հունիս",
  "Հուլիս", "Օգոստոս", "Սեպտեմբեր", "Հոկտեմբեր", "Նոյեմբեր", "Դեկտեմբեր",
];
const MONTH_GENITIVE = [
  "հունվարի", "փետրվարի", "մարտի", "ապրիլի", "մայիսի", "հունիսի",
  "հուլիսի", "օգոստոսի", "սեպտեմբերի", "հոկտեմբերի", "նոյեմբերի", "դեկտեմբերի",
];
// Monday first, as calendars are printed in Armenia.
export const WEEKDAYS_SHORT = ["Երկ", "Երք", "Չրք", "Հնգ", "Ուրբ", "Շբթ", "Կիր"];
const WEEKDAYS_LONG = [
  "Երկուշաբթի", "Երեքշաբթի", "Չորեքշաբթի", "Հինգշաբթի", "Ուրբաթ", "Շաբաթ", "Կիրակի",
];

const pad = (n: number) => String(n).padStart(2, "0");

/** The Yerevan calendar date of an instant. */
export function yerevanDate(instant: Date | string): Ymd {
  const shifted = new Date(new Date(instant).getTime() + OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

export const dayKey = (d: Ymd) => `${d.year}-${pad(d.month)}-${pad(d.day)}`;
export const monthKey = (d: { year: number; month: number }) =>
  `${d.year}-${pad(d.month)}`;

/** "2026-10" → { year, month }, or null if malformed. */
export function parseMonth(value: unknown): { year: number; month: number } | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  return month >= 1 && month <= 12 ? { year, month } : null;
}

/** "2026-10-16" → Ymd, or null if malformed or not a real date. */
export function parseDay(value: unknown): Ymd | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const d = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  const check = new Date(Date.UTC(d.year, d.month - 1, d.day));
  return check.getUTCMonth() === d.month - 1 && check.getUTCDate() === d.day ? d : null;
}

/** The UTC instant at which a Yerevan calendar day starts. */
export function startOfDayUtc(d: Ymd): Date {
  return new Date(Date.UTC(d.year, d.month - 1, d.day) - OFFSET_MS);
}

export function addMonths(m: { year: number; month: number }, delta: number) {
  const index = m.year * 12 + (m.month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

export function daysInMonth(m: { year: number; month: number }) {
  return new Date(Date.UTC(m.year, m.month, 0)).getUTCDate();
}

/** 0 = Monday … 6 = Sunday. */
export function weekdayIndex(d: Ymd) {
  return (new Date(Date.UTC(d.year, d.month - 1, d.day)).getUTCDay() + 6) % 7;
}

/** "Հինգշաբթի, 16 հոկտեմբերի 2026" */
export function formatLongDay(d: Ymd) {
  return `${WEEKDAYS_LONG[weekdayIndex(d)]}, ${d.day} ${MONTH_GENITIVE[d.month - 1]} ${d.year}`;
}
