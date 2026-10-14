import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "cn";
import { formatNumber } from "@/lib/format";

export const PAGE_SIZE = 25;

/** Page number from the URL: a whole number from 1 up, anything else is 1. */
export function parsePage(value: string | string[] | undefined): number {
  const page = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

/** Page numbers to show, with null for a gap: 1 … 4 5 6 … 12 */
function pageList(page: number, totalPages: number): (number | null)[] {
  const wanted = new Set([1, totalPages, page - 1, page, page + 1]);
  const pages: (number | null)[] = [];
  for (let n = 1; n <= totalPages; n++) {
    if (!wanted.has(n)) continue;
    const previous = pages[pages.length - 1];
    if (typeof previous === "number" && n - previous > 1) pages.push(null);
    pages.push(n);
  }
  return pages;
}

/**
 * Plain links, so the page number lives in the URL alongside any filters.
 * `params` are the other query parameters to keep (sort, search, ...).
 */
export function Pagination({
  basePath,
  params = {},
  page,
  total,
  pageSize = PAGE_SIZE,
}: {
  basePath: string;
  params?: Record<string, string | undefined>;
  page: number;
  total: number;
  pageSize?: number;
}) {
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  if (total === 0) return null;

  const hrefFor = (target: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params))
      if (value) query.set(key, value);
    if (target > 1) query.set("page", String(target));
    const text = query.toString();
    return text ? `${basePath}?${text}` : basePath;
  };
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const step =
    "flex size-9 items-center justify-center rounded-full text-sm font-medium tabular-nums outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <nav
      aria-label="Էջեր"
      className="flex flex-wrap items-center justify-between gap-3 px-1"
    >
      <p className="text-sm text-muted-foreground tabular-nums">
        {formatNumber(from)}–{formatNumber(to)} / {formatNumber(total)}
      </p>
      {totalPages > 1 && (
        <div className="flex items-center gap-1 rounded-full bg-card p-1 shadow-soft">
          {page > 1 ? (
            <Link
              href={hrefFor(page - 1)}
              aria-label="Նախորդ էջ"
              className={cn(step, "hover:bg-muted")}
            >
              <ChevronLeft className="size-4" />
            </Link>
          ) : (
            <span aria-hidden className={cn(step, "opacity-30")}>
              <ChevronLeft className="size-4" />
            </span>
          )}
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
              <Link
                key={n}
                href={hrefFor(n)}
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
              </Link>
            ),
          )}
          {page < totalPages ? (
            <Link
              href={hrefFor(page + 1)}
              aria-label="Հաջորդ էջ"
              className={cn(step, "hover:bg-muted")}
            >
              <ChevronRight className="size-4" />
            </Link>
          ) : (
            <span aria-hidden className={cn(step, "opacity-30")}>
              <ChevronRight className="size-4" />
            </span>
          )}
        </div>
      )}
    </nav>
  );
}
