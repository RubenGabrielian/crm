const dateTimeFormat = new Intl.DateTimeFormat("hy-AM", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Yerevan",
});

// Grouped by hand rather than with Intl: Node and browsers disagree on the
// hy-AM separator, which made server and client render different text.
export function formatNumber(value: number) {
  const [whole, fraction] = (Math.round(value * 100) / 100).toString().split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
  return fraction ? `${grouped}.${fraction}` : grouped;
}

export function formatMoney(value: number) {
  return `${formatNumber(value)}\u00a0֏`;
}

export function formatDateTime(value: string) {
  return dateTimeFormat.format(new Date(value));
}
