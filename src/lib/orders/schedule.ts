// An order's appointment (e.g. when the glass is fitted), kept in
// metadata.scheduled_at as an ISO timestamp. Armenia is UTC+4 all year.

const YEREVAN_OFFSET = "+04:00";

/** "2026-10-21T14:00" from a datetime-local input → ISO, or null if empty/bad. */
export function scheduleFromInput(value: string): string | null | "invalid" {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return "invalid";
  const iso = `${value}:00${YEREVAN_OFFSET}`;
  return Number.isNaN(Date.parse(iso)) ? "invalid" : iso;
}

/** ISO timestamp → "2026-10-21T14:00" in Yerevan time, for a datetime-local input. */
export function scheduleToInput(iso: string | null): string {
  if (!iso) return "";
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return "";
  return new Date(time + 4 * 60 * 60 * 1000).toISOString().slice(0, 16);
}
