"use client";

import { useActionState, useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/config/orders";
import { formatMoney } from "@/lib/format";
import { updateOrder, type OrderFormState } from "@/lib/orders/actions";
import type { Order } from "@/lib/orders/queries";
import { computeOrderTotals } from "@/lib/orders/totals";
import { useRefreshNewOrders } from "@/components/layout/new-orders";
import { useTenant } from "@/lib/tenant/tenant-context";

const INITIAL_STATE: OrderFormState = {
  ok: false,
  values: {},
  errors: {},
  formError: null,
};

function shortId(id: string) {
  return `#${id.slice(0, 8).toUpperCase()}`;
}

export function EditOrderDialog({ order }: { order: Order }) {
  const { businessType } = useTenant();
  const [open, setOpen] = useState(false);
  const isShop = businessType === "ecommerce";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Խմբագրել պատվերը ${shortId(order.id)}`}
          />
        }
      >
        <Pencil />
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isShop ? "Խմբագրել պատվերը" : "Խմբագրել գրանցումը"}{" "}
            {shortId(order.id)}
          </DialogTitle>
          <DialogDescription>
            {order.customerName}, {order.productTitle}
          </DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so each opening starts from the saved order. */}
        <EditOrderForm order={order} onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function toNumber(value: string) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function EditOrderForm({
  order,
  onSaved,
}: {
  order: Order;
  onSaved: () => void;
}) {
  const { businessType } = useTenant();
  const isShop = businessType === "ecommerce";

  const refreshNewOrders = useRefreshNewOrders();
  const [state, formAction, pending] = useActionState(
    async (prev: OrderFormState, formData: FormData) => {
      const next = await updateOrder(order.id, prev, formData);
      if (next.ok) {
        refreshNewOrders();
        onSaved();
      }
      return next;
    },
    INITIAL_STATE,
  );

  // Controlled, so the totals below recalculate on every keystroke.
  const [phone, setPhone] = useState(order.customerPhone ?? "");
  const [address, setAddress] = useState(order.address ?? "");
  const [qty, setQty] = useState(String(order.qty));
  const [percent, setPercent] = useState(
    order.discountPercent > 0 ? String(order.discountPercent) : "",
  );
  const [amount, setAmount] = useState(
    order.discountAmount > 0 ? String(order.discountAmount) : "",
  );
  const [deliveryFee, setDeliveryFee] = useState(String(order.deliveryFee));
  const [status, setStatus] = useState(order.status);

  const percentActive = toNumber(percent) > 0;
  const totals = computeOrderTotals({
    qty: Math.max(Math.trunc(toNumber(qty)), 0),
    unitPrice: order.unitPrice,
    discountPercent: toNumber(percent),
    discountAmount: toNumber(amount),
    deliveryFee: toNumber(deliveryFee),
  });
  const discountTooBig = totals.discount > totals.subtotal;
  const errors: Record<string, string | undefined> = {
    ...state.errors,
    ...(discountTooBig
      ? { discount_amount: "Զեղչը չի կարող գերազանցել ապրանքի գումարը" }
      : {}),
  };

  return (
    <form action={formAction} noValidate className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          name="phone"
          label="Հեռախոս"
          type="tel"
          value={phone}
          onChange={setPhone}
          error={errors.phone}
        />
        <Field data-invalid={errors.status ? true : undefined}>
          <FieldLabel htmlFor="order-status">Կարգավիճակ</FieldLabel>
          <select
            id="order-status"
            name="status"
            value={status}
            onChange={(event) =>
              setStatus(event.currentTarget.value as typeof status)
            }
            className="h-10 w-full rounded-xl border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {ORDER_STATUSES.map((value) => (
              <option key={value} value={value}>
                {ORDER_STATUS_LABELS[businessType][value]}
              </option>
            ))}
          </select>
          {errors.status && <FieldError>{errors.status}</FieldError>}
        </Field>
      </div>

      {isShop && (
        <TextField
          name="address"
          label="Հասցե"
          value={address}
          onChange={setAddress}
          error={errors.address}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          name="qty"
          label="Քանակ"
          type="number"
          min={1}
          step={1}
          value={qty}
          onChange={setQty}
          error={errors.qty}
        />
        {isShop ? (
          <TextField
            name="delivery_fee"
            label="Առաքման արժեք (֏)"
            type="number"
            min={0}
            step="any"
            value={deliveryFee}
            onChange={setDeliveryFee}
            error={errors.delivery_fee}
          />
        ) : (
          <input type="hidden" name="delivery_fee" value={deliveryFee} />
        )}
        <TextField
          name="discount_percent"
          label="Զեղչ (%)"
          type="number"
          min={0}
          max={100}
          step="any"
          value={percent}
          onChange={setPercent}
          error={errors.discount_percent}
        />
        <TextField
          name="discount_amount"
          label="Զեղչ (֏)"
          type="number"
          min={0}
          step="any"
          // While a percent is set, the amount is derived from it. Typing an
          // amount switches to a fixed discount and clears the percent.
          value={percentActive ? String(totals.discount) : amount}
          onChange={(value) => {
            setAmount(value);
            setPercent("");
          }}
          error={errors.discount_amount}
          description={percentActive ? "Հաշվարկվում է տոկոսից" : undefined}
        />
      </div>

      <dl
        aria-live="polite"
        className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 rounded-2xl bg-muted px-4 py-3 text-sm tabular-nums"
      >
        <dt className="text-muted-foreground">
          {formatMoney(order.unitPrice)} ×{" "}
          {Math.max(Math.trunc(toNumber(qty)), 0)}
        </dt>
        <dd className="text-right">{formatMoney(totals.subtotal)}</dd>
        <dt className="text-muted-foreground">Զեղչ</dt>
        <dd className="text-right">
          {totals.discount > 0 ? `−${formatMoney(totals.discount)}` : "—"}
        </dd>
        <dt className="font-medium">Ապրանքի գումար</dt>
        <dd className="text-right font-medium">
          {formatMoney(totals.productTotal)}
        </dd>
        {isShop && (
          <>
            <dt className="text-muted-foreground">Առաքում</dt>
            <dd className="text-right">{formatMoney(toNumber(deliveryFee))}</dd>
          </>
        )}
        <dt className="mt-1 border-t pt-2 text-base font-semibold">Ընդամենը</dt>
        <dd className="mt-1 border-t pt-2 text-right text-base font-semibold">
          {formatMoney(totals.orderTotal)}
        </dd>
      </dl>

      {state.formError && <FieldError>{state.formError}</FieldError>}

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          Չեղարկել
        </DialogClose>
        <Button type="submit" disabled={pending || discountTooBig}>
          {pending ? "Պահպանվում է…" : "Պահպանել"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function TextField({
  name,
  label,
  value,
  onChange,
  error,
  description,
  ...input
}: {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  description?: string;
} & Omit<React.ComponentProps<typeof Input>, "name" | "value" | "onChange">) {
  const id = `order-${name}`;
  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        name={name}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        autoComplete="off"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...input}
      />
      {description && !error && (
        <FieldDescription>{description}</FieldDescription>
      )}
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </Field>
  );
}
