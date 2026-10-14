"use client";

import { useOptimistic, useState, useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "cn";
import { setExpensePaid } from "@/lib/expenses/actions";

/** Changes an expense between paid and unpaid straight from the table. */
export function ExpensePaidSelect({
  expenseId,
  paid,
  label,
}: {
  expenseId: string;
  paid: boolean;
  /** Accessible name, e.g. "Մարքեթինգ, 5 000 ֏". */
  label: string;
}) {
  const [pending, startTransition] = useTransition();
  // Shows the new status immediately; falls back to the saved one on failure.
  const [shown, setShown] = useOptimistic(paid);
  const [error, setError] = useState<string | null>(null);

  function change(next: boolean) {
    setError(null);
    startTransition(async () => {
      setShown(next);
      const result = await setExpensePaid(expenseId, next);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <span className="relative inline-flex">
        <select
          aria-label={`Կարգավիճակ՝ ${label}`}
          value={shown ? "paid" : "unpaid"}
          disabled={pending}
          onChange={(event) => change(event.currentTarget.value === "paid")}
          className={cn(
            "cursor-pointer appearance-none rounded-full py-1 pr-7 pl-2.5 text-xs font-medium outline-none",
            "focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-70",
            shown
              ? "bg-emerald-100 text-emerald-900"
              : "bg-amber-100 text-amber-900",
          )}
        >
          <option value="paid">Վճարված</option>
          <option value="unpaid">Չվճարված</option>
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 opacity-70"
        />
      </span>
      {error && (
        <span
          role="alert"
          className="max-w-40 text-xs whitespace-normal text-destructive"
        >
          {error}
        </span>
      )}
    </span>
  );
}
