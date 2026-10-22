"use client";

import { useOptimistic, useState, useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "cn";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@/config/orders";
import { updateOrderStatus } from "@/lib/orders/actions";
import { useRefreshNewOrders } from "@/components/layout/new-orders";
import { useTenant } from "@/lib/tenant/tenant-context";

// One hue per status so they can be told apart at a glance:
// amber = needs attention, violet = waiting for stock, blue = in progress, green = done.
const STATUS_STYLES: Record<OrderStatus, string> = {
  new: "bg-amber-100 text-amber-900",
  preorder: "bg-violet-100 text-violet-900",
  confirmed: "bg-blue-100 text-blue-900",
  completed: "bg-emerald-100 text-emerald-900",
};

export function OrderStatusSelect({
  orderId,
  status,
  label,
}: {
  orderId: string;
  status: OrderStatus;
  /** Accessible name, e.g. the short order number. */
  label: string;
}) {
  const { businessType } = useTenant();
  const [pending, startTransition] = useTransition();
  // Shows the new status immediately; falls back to the saved one on failure.
  const [shown, setShown] = useOptimistic(status);
  const [error, setError] = useState<string | null>(null);
  const refreshNewOrders = useRefreshNewOrders();

  function change(next: OrderStatus) {
    setError(null);
    startTransition(async () => {
      setShown(next);
      const result = await updateOrderStatus(orderId, next);
      if (!result.ok) setError(result.error);
      else refreshNewOrders();
    });
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <span className="relative inline-flex">
        <select
          aria-label={`Կարգավիճակ՝ ${label}`}
          value={shown}
          disabled={pending}
          onChange={(event) => change(event.currentTarget.value as OrderStatus)}
          className={cn(
            "cursor-pointer appearance-none rounded-full py-1 pr-7 pl-2.5 text-xs font-medium outline-none",
            "focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-70",
            STATUS_STYLES[shown],
          )}
        >
          {ORDER_STATUSES.map((value) => (
            <option key={value} value={value}>
              {ORDER_STATUS_LABELS[businessType][value]}
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
