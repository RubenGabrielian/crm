"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "cn";
import { StockTable, type StockRow } from "@/components/inventory/stock-table";
import { pageList } from "@/components/layout/pagination";
import { formatNumber } from "@/lib/format";

const PAGE_SIZE = 20;

/**
 * The warehouse table split into pages in the browser. All rows are already
 * loaded; this only keeps a long list tidy.
 */
export function PaginatedStockTable({
  rows,
  nameLabel,
}: {
  rows: StockRow[];
  nameLabel: string;
}) {
  const totalPages = Math.max(Math.ceil(rows.length / PAGE_SIZE), 1);
  const [wanted, setPage] = useState(1);
  // Rows can disappear (e.g. a deleted material), so stay within range.
  const page = Math.min(wanted, totalPages);
  const from = (page - 1) * PAGE_SIZE;
  const shown = rows.slice(from, from + PAGE_SIZE);

  const step =
    "flex size-9 items-center justify-center rounded-lg text-sm font-medium tabular-nums outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-30";

  return (
    <div className="flex flex-col gap-4">
      <StockTable rows={shown} nameLabel={nameLabel} />
      {totalPages > 1 && (
        <nav
          aria-label={`${nameLabel}ների էջեր`}
          className="flex flex-wrap items-center justify-between gap-3 px-1"
        >
          <p className="text-sm text-muted-foreground tabular-nums">
            {formatNumber(from + 1)}–{formatNumber(from + shown.length)} /{" "}
            {formatNumber(rows.length)}
          </p>
          <div className="flex items-center gap-1 rounded-xl bg-card p-1 shadow-soft">
            <button
              type="button"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              aria-label="Նախորդ էջ"
              className={cn(step, "hover:bg-muted")}
            >
              <ChevronLeft className="size-4" />
            </button>
            {pageList(page, totalPages).map((n, index) =>
              n === null ? (
                <span
                  key={`gap-${index}`}
                  aria-hidden
                  className="px-1 text-sm text-muted-foreground"
                >
                  …
                </span>
              ) : (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  aria-label={`Էջ ${n}`}
                  aria-current={n === page ? "page" : undefined}
                  className={cn(
                    step,
                    n === page
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted",
                  )}
                >
                  {n}
                </button>
              ),
            )}
            <button
              type="button"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              aria-label="Հաջորդ էջ"
              className={cn(step, "hover:bg-muted")}
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
