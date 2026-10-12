"use client";

import { useOptimistic, useState, useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "cn";
import { updateOrderSource } from "@/lib/orders/source-actions";

export function OrderSourceSelect({
  orderId,
  source,
  options,
  label,
}: {
  orderId: string;
  source: string | null;
  /** Names from the tenant's source list. */
  options: string[];
  /** Accessible name, e.g. the short order number. */
  label: string;
}) {
  const [pending, startTransition] = useTransition();
  // Shows the new source immediately; falls back to the saved one on failure.
  const [shown, setShown] = useOptimistic(source ?? "");
  const [error, setError] = useState<string | null>(null);

  // A source that was later removed from the list stays visible on its order.
  const names = shown && !options.includes(shown) ? [shown, ...options] : options;

  function change(next: string) {
    setError(null);
    startTransition(async () => {
      setShown(next);
      const result = await updateOrderSource(orderId, next);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <span className="relative inline-flex">
        <select
          aria-label={`Աղբյուր՝ ${label}`}
          value={shown}
          disabled={pending}
          onChange={(event) => change(event.currentTarget.value)}
          className={cn(
            "max-w-36 cursor-pointer appearance-none truncate rounded-full border bg-card py-1 pr-7 pl-2.5 text-xs outline-none",
            "focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-70",
            !shown && "border-dashed text-muted-foreground",
          )}
        >
          <option value="">Աղբյուր չկա</option>
          {names.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 opacity-70"
        />
      </span>
      {error && (
        <span role="alert" className="max-w-40 text-xs whitespace-normal text-destructive">
          {error}
        </span>
      )}
    </span>
  );
}
