import { cn } from "cn";
import { ProductThumb } from "@/components/products/product-thumb";
import { formatNumber } from "@/lib/format";

export type StockRow = {
  key: string;
  name: string;
  /** Small line under the name, e.g. the unit. */
  note?: string;
  thumb?: string | null;
  received: number;
  sales: number;
  gifts: number;
  available: number;
  actions: React.ReactNode;
};

function amount(value: number) {
  return formatNumber(Math.round(value * 100) / 100);
}

/**
 * Short headings, with the three "written off" columns grouped under one
 * label, so no heading has to wrap. A bar under "available" shows how much
 * of everything received is left.
 */
// One line each; the full wording shows on hover and is read by screen readers.
const HEADINGS = [
  { label: "name", title: undefined },
  { label: "Մուտք", title: "Մուտքագրված ընդհանուր քանակ" },
  { label: "Վաճառք", title: "Վաճառքներից դուրս գրված" },
  { label: "Նվեր", title: "Նվերներից դուրս գրված" },
  { label: "Օգտագործված", title: "Ընդհանուր օգտագործված (վաճառք + նվեր)" },
  { label: "Առկա", title: "Առկա քանակ" },
  { label: "actions", title: undefined },
] as const;

export function StockTable({
  rows,
  nameLabel,
}: {
  rows: StockRow[];
  nameLabel: string;
}) {
  const th =
    "px-3 py-2.5 text-right text-xs font-medium whitespace-nowrap text-muted-foreground";
  const td = "px-3 py-3.5 text-right tabular-nums";

  return (
    <div className="overflow-x-auto rounded-3xl bg-card p-3 shadow-soft">
      <table className="w-full min-w-[48rem] border-separate border-spacing-0 text-sm">
        <colgroup>
          <col className="min-w-56" />
          <col className="w-[5.5rem]" />
          <col className="w-[5.5rem]" />
          <col className="w-[5.5rem]" />
          <col className="w-[7rem]" />
          <col className="w-32" />
          <col className="w-48" />
        </colgroup>
        <thead>
          <tr>
            {HEADINGS.map((heading, index) => (
              <th
                key={heading.label}
                scope="col"
                title={heading.title}
                className={cn(
                  th,
                  "bg-muted",
                  index === 0 && "rounded-l-2xl pl-4 text-left",
                  index === HEADINGS.length - 1 && "rounded-r-2xl",
                )}
              >
                {index === 0 ? (
                  nameLabel
                ) : index === HEADINGS.length - 1 ? (
                  <span className="sr-only">Գործողություններ</span>
                ) : (
                  heading.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const used = row.sales + row.gifts;
            const share =
              row.received > 0 ? Math.max(row.available, 0) / row.received : 0;
            const low = row.available > 0 && share < 0.15;
            return (
              <tr key={row.key} className="group">
                <td className="border-b border-border/60 py-3 pr-3 pl-4 group-last:border-0">
                  <span className="flex min-w-0 items-center gap-3">
                    {row.thumb !== undefined && (
                      <ProductThumb src={row.thumb} alt="" />
                    )}
                    <span className="min-w-0">
                      <span className="block font-medium">{row.name}</span>
                      {row.note && (
                        <span className="block text-xs text-muted-foreground">
                          {row.note}
                        </span>
                      )}
                    </span>
                  </span>
                </td>
                <td
                  className={cn(
                    td,
                    "border-b border-border/60 group-last:border-0",
                  )}
                >
                  {amount(row.received)}
                </td>
                <td
                  className={cn(
                    td,
                    "border-b border-border/60 text-muted-foreground group-last:border-0",
                  )}
                >
                  {amount(row.sales)}
                </td>
                <td
                  className={cn(
                    td,
                    "border-b border-border/60 text-muted-foreground group-last:border-0",
                  )}
                >
                  {amount(row.gifts)}
                </td>
                <td
                  className={cn(
                    td,
                    "border-b border-border/60 group-last:border-0",
                  )}
                >
                  {amount(used)}
                </td>
                <td
                  className={cn(
                    td,
                    "border-b border-border/60 group-last:border-0",
                  )}
                >
                  <span
                    className={cn(
                      "block font-semibold",
                      row.available <= 0 && "text-destructive",
                      low && "text-amber-700",
                    )}
                  >
                    {row.available === 0 ? "Սպառված է" : amount(row.available)}
                  </span>
                  <span
                    aria-hidden
                    className="mt-1.5 ml-auto block h-1.5 w-20 overflow-hidden rounded-full bg-muted"
                  >
                    <span
                      className={cn(
                        "block h-full rounded-full",
                        low ? "bg-amber-500" : "bg-ring",
                      )}
                      style={{ width: `${share * 100}%` }}
                    />
                  </span>
                </td>
                <td className="border-b border-border/60 py-3 pr-4 pl-3 group-last:border-0">
                  <span className="flex items-center justify-end gap-1.5">
                    {row.actions}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
