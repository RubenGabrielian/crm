"use client";

import { useOptimistic, useState, useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "cn";
import { COST_TYPES, COST_TYPE_LABELS, type CostType } from "@/config/expenses";
import { setExpenseCostType } from "@/lib/expenses/actions";

/** Fixed / variable pill, changed straight from the table. */
export function ExpenseCostTypeSelect({
  expenseId,
  costType,
  label,
}: {
  expenseId: string;
  costType: CostType;
  label: string;
}) {
  const [pending, startTransition] = useTransition();
  const [shown, setShown] = useOptimistic(costType);
  const [error, setError] = useState<string | null>(null);

  function change(next: CostType) {
    setError(null);
    startTransition(async () => {
      setShown(next);
      const result = await setExpenseCostType(expenseId, next);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <span className="relative inline-flex">
        <select
          aria-label={`Ծախսի տեսակ՝ ${label}`}
          value={shown}
          disabled={pending}
          onChange={(event) => change(event.currentTarget.value as CostType)}
          className={cn(
            "cursor-pointer appearance-none rounded-full py-1 pr-7 pl-2.5 text-xs font-medium outline-none",
            "focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-70",
            shown === "fixed"
              ? "bg-sky-100 text-sky-900"
              : "bg-[#e8efff] text-[#1146c4]",
          )}
        >
          {COST_TYPES.map((type) => (
            <option key={type} value={type}>
              {COST_TYPE_LABELS[type]}
            </option>
          ))}
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
