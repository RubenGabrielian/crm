"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "cn";
import { TruncatedText } from "@/components/ui/truncated-text";
import { formatNumber } from "@/lib/format";

const VISIBLE = 5;

/**
 * Stock on the dashboard: the items closest to running out first, the first
 * five shown and the rest behind a "show more" button.
 */
export function StockList({
  rows,
}: {
  rows: { productId: string; title: string; available: number }[];
}) {
  const [expanded, setExpanded] = useState(false);
  const sorted = [...rows].sort((a, b) => a.available - b.available);
  const shown = expanded ? sorted : sorted.slice(0, VISIBLE);
  const hidden = sorted.length - VISIBLE;

  return (
    <>
      <ul className="divide-y divide-border/70 px-2 text-sm">
        {shown.map((row) => (
          <li
            key={row.productId}
            className="flex items-center justify-between gap-4 py-3"
          >
            <TruncatedText className="min-w-0">{row.title}</TruncatedText>
            <span
              className={cn(
                "shrink-0 font-semibold tabular-nums",
                row.available === 0 && "text-destructive",
              )}
            >
              {row.available === 0 ? "Սպառված է" : formatNumber(row.available)}
            </span>
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-medium text-primary outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        >
          {expanded ? "Թաքցնել" : `Ցույց տալ ևս ${formatNumber(hidden)}`}
          <ChevronDown
            className={cn("size-4 transition-transform", expanded && "rotate-180")}
            aria-hidden
          />
        </button>
      )}
    </>
  );
}
