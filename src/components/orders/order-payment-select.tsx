"use client";

import { useOptimistic, useState, useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "cn";
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from "@/config/payments";
import { updateOrderPayment } from "@/lib/orders/actions";

/** Paid / unpaid pill and the payment method, both changed straight from the table. */
export function OrderPaymentSelect({
  orderId,
  paid,
  method,
  label,
}: {
  orderId: string;
  paid: boolean;
  method: PaymentMethod | null;
  /** Accessible name, e.g. the short order number. */
  label: string;
}) {
  const [pending, startTransition] = useTransition();
  // Shows the change immediately; falls back to the saved values on failure.
  const [shown, setShown] = useOptimistic({ paid, method });
  const [error, setError] = useState<string | null>(null);

  function save(change: { paid?: boolean; method?: PaymentMethod | null }) {
    setError(null);
    startTransition(async () => {
      setShown({ ...shown, ...change });
      const result = await updateOrderPayment(orderId, change);
      if (!result.ok) setError(result.error);
    });
  }

  const pill =
    "cursor-pointer appearance-none rounded-full py-1 pr-7 pl-2.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-70";

  return (
    <span className="inline-flex flex-col items-start gap-1.5">
      <span className="relative inline-flex">
        <select
          aria-label={`Վճարում՝ ${label}`}
          value={shown.paid ? "yes" : "no"}
          disabled={pending}
          onChange={(event) =>
            save({ paid: event.currentTarget.value === "yes" })
          }
          className={cn(
            pill,
            "font-medium",
            shown.paid
              ? "bg-emerald-100 text-emerald-900"
              : "bg-rose-100 text-rose-900",
          )}
        >
          <option value="yes">Վճարված</option>
          <option value="no">Չվճարված</option>
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 opacity-70"
        />
      </span>
      <span className="relative inline-flex">
        <select
          aria-label={`Վճարման եղանակ՝ ${label}`}
          value={shown.method ?? ""}
          disabled={pending}
          onChange={(event) =>
            save({
              method: (event.currentTarget.value ||
                null) as PaymentMethod | null,
            })
          }
          className={cn(
            pill,
            "max-w-32 truncate border bg-card",
            !shown.method && "border-dashed text-muted-foreground",
          )}
        >
          <option value="">Եղանակ չկա</option>
          {PAYMENT_METHODS.map((value) => (
            <option key={value} value={value}>
              {PAYMENT_METHOD_LABELS[value]}
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
