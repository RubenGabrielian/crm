"use client";

import type { ReactNode } from "react";
import { cn } from "cn";
import { Check, ListChecks, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";

// A <tr> can't be rounded, so hover and selection paint the cells and round
// the outer ones, matching the pill-shaped header.
export const SELECTABLE_ROW = cn(
  "hover:bg-transparent data-[state=selected]:bg-transparent data-[state=selected]:border-card",
  "[&>td]:transition-colors [&>td:first-child]:rounded-l-2xl [&>td:last-child]:rounded-r-2xl",
  "hover:[&>td]:bg-muted/40 data-[state=selected]:[&>td]:bg-primary/4 data-[state=selected]:hover:[&>td]:bg-primary/8",
);

export function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <span className="relative inline-flex size-[18px] shrink-0 align-middle">
      <input
        type="checkbox"
        role="checkbox"
        aria-label={label}
        checked={checked}
        ref={(el) => {
          if (el) el.indeterminate = indeterminate;
        }}
        onChange={(event) => onChange(event.currentTarget.checked)}
        className="peer size-full cursor-pointer appearance-none rounded-md border-[1.5px] border-muted-foreground/40 bg-card transition-colors outline-none hover:border-primary checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      <Check
        aria-hidden
        strokeWidth={3}
        className="pointer-events-none absolute inset-0 m-auto hidden size-3 text-primary-foreground peer-checked:block"
      />
      <Minus
        aria-hidden
        strokeWidth={3}
        className="pointer-events-none absolute inset-0 m-auto hidden size-3 text-primary-foreground peer-indeterminate:block"
      />
    </span>
  );
}

/**
 * The strip above a table while rows are selected: how many, a button that
 * reaches past this page, clearing, and the delete action (`children`).
 */
export function SelectionBar({
  selected,
  total,
  wholePage,
  onSelectAll,
  selectingAll = false,
  onClear,
  children,
}: {
  selected: number;
  /** Rows on all pages. */
  total: number;
  /** Exactly this page's rows are selected. */
  wholePage: boolean;
  onSelectAll: () => void;
  selectingAll?: boolean;
  onClear: () => void;
  children: ReactNode;
}) {
  const everything = total > 0 && selected >= total;
  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-primary/8 py-2 pr-2 pl-4 text-sm">
      <span className="font-medium">
        {everything
          ? `Ընտրված են բոլոր ${formatNumber(total)}-ը`
          : wholePage
            ? `Ընտրված են այս էջի բոլոր ${formatNumber(selected)}-ը`
            : `Ընտրված է՝ ${formatNumber(selected)}`}
      </span>
      {/* The page checkbox only covers this page; this reaches the rest. */}
      {!everything && (
        <Button
          variant="outline"
          size="sm"
          disabled={selectingAll}
          onClick={onSelectAll}
        >
          <ListChecks />
          {selectingAll
            ? "Ընտրվում է…"
            : `Ընտրել բոլոր ${formatNumber(total)}-ը`}
        </Button>
      )}
      <button
        type="button"
        onClick={onClear}
        className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        Հանել ընտրությունը
      </button>
      <span className="ml-auto">{children}</span>
    </div>
  );
}
