export type RecurringExpense = {
  id: string;
  category: string;
  description: string | null;
  amount: number;
  /** YYYY-MM-DD. Charged monthly on this date's day of the month. */
  startDate: string;
  /** Last day it applies, or null while it is still running. */
  endDate: string | null;
};

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * The dates on which a monthly expense is charged between `from` and `to`
 * (inclusive). Never before it started, after it ended, or in the future.
 * A charge day that a month doesn't have (e.g. the 31st) falls on its last day.
 */
export function chargeDates(
  expense: Pick<RecurringExpense, "startDate" | "endDate">,
  from: string,
  to: string,
  today: string,
): string[] {
  const first = expense.startDate > from ? expense.startDate : from;
  let last = to < today ? to : today;
  if (expense.endDate && expense.endDate < last) last = expense.endDate;
  if (first > last) return [];

  const chargeDay = Number(expense.startDate.slice(8, 10));
  let year = Number(first.slice(0, 4));
  let month = Number(first.slice(5, 7));
  const dates: string[] = [];

  while (true) {
    const day = Math.min(chargeDay, daysInMonth(year, month));
    const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (date > last) break;
    if (date >= first) dates.push(date);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return dates;
}
