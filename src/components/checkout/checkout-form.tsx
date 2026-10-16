"use client";

import { useActionState, useState } from "react";
import { CircleCheck, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/format";
import { placeOrder, type OrderFormState } from "@/lib/orders/actions";
import { computeOrderTotals } from "@/lib/orders/totals";
import type { LinkSale } from "@/lib/orders/sale-link";
import type { CheckoutProduct } from "@/lib/products/queries";
import type { BusinessType } from "@/lib/tenant/features";

const INITIAL_STATE: OrderFormState = {
  ok: false,
  values: {},
  errors: {},
  formError: null,
};

const MAX_QTY = 99;

const COPY: Record<
  BusinessType,
  { qty: string; submit: string; doneTitle: string; doneText: string }
> = {
  ecommerce: {
    qty: "Քանակ",
    submit: "Պատվիրել",
    doneTitle: "Պատվերն ընդունված է",
    doneText: "Շուտով կկապվենք ձեզ հետ՝ առաքումը հաստատելու համար։",
  },
  service: {
    qty: "Տեղերի քանակ",
    submit: "Գրանցվել",
    doneTitle: "Գրանցումն ընդունված է",
    doneText: "Շուտով կկապվենք ձեզ հետ՝ մանրամասները հաստատելու համար։",
  },
};

type CheckoutField = {
  name: "name" | "email" | "phone" | "address";
  label: string;
  type: string;
  autoComplete: string;
  required: boolean;
};

export function CheckoutForm({
  product,
  sale,
  linkRef = null,
}: {
  product: CheckoutProduct;
  /** Already verified by the page; the server checks it again on submit. */
  sale: LinkSale | null;
  /** Id of the admin's private link note, if the link had one. */
  linkRef?: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    placeOrder.bind(null, product.id, sale, linkRef),
    INITIAL_STATE,
  );
  const [qty, setQty] = useState(1);

  const isShop = product.businessType === "ecommerce";
  const copy = COPY[product.businessType];
  const maxQty = Math.min(product.stock ?? MAX_QTY, MAX_QTY);
  const clampQty = (value: number) =>
    Math.min(Math.max(Number.isFinite(value) ? Math.trunc(value) : 1, 1), Math.max(maxQty, 1));

  const totals = computeOrderTotals({
    qty,
    unitPrice: product.price,
    discountPercent: sale?.percent ?? 0,
    discountAmount: 0,
    deliveryFee: product.deliveryFee,
  });

  const fields: CheckoutField[] = [
    { name: "name", label: "Անուն Ազգանուն", type: "text", autoComplete: "name", required: true },
    { name: "phone", label: "Հեռախոս", type: "tel", autoComplete: "tel", required: true },
    { name: "email", label: "Էլ. հասցե", type: "email", autoComplete: "email", required: false },
  ];
  if (isShop) {
    fields.push({
      name: "address",
      label: "Հասցե",
      type: "text",
      autoComplete: "street-address",
      required: true,
    });
  }

  if (state.ok) {
    return (
      <div role="status" className="rounded-2xl bg-muted px-5 py-6">
        <CircleCheck className="size-7 text-violet-600" strokeWidth={1.75} aria-hidden />
        <h2 className="mt-3 text-base font-semibold">{copy.doneTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{copy.doneText}</p>
      </div>
    );
  }

  // Checked after the success state: buying the last unit refreshes the page
  // with stock = 0, and that buyer must still see the confirmation.
  if (product.stock === 0) {
    return (
      <p className="rounded-2xl bg-muted px-5 py-4 text-sm font-medium">
        Ցավոք, ապրանքը սպառվել է։
      </p>
    );
  }

  return (
    <form action={formAction} noValidate className="grid gap-5">
      <FieldGroup className="gap-4">
        <Field data-invalid={state.errors.qty ? true : undefined}>
          <FieldLabel htmlFor="checkout-qty">{copy.qty}</FieldLabel>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              className="size-10"
              aria-label="Պակասեցնել քանակը"
              disabled={qty <= 1}
              onClick={() => setQty(clampQty(qty - 1))}
            >
              <Minus />
            </Button>
            <Input
              id="checkout-qty"
              name="qty"
              type="number"
              inputMode="numeric"
              min={1}
              max={maxQty}
              step={1}
              value={qty}
              onChange={(event) => setQty(clampQty(event.currentTarget.valueAsNumber))}
              className="h-10 w-20 text-center tabular-nums"
              aria-invalid={state.errors.qty ? true : undefined}
              aria-describedby={state.errors.qty ? "checkout-qty-error" : undefined}
            />
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              className="size-10"
              aria-label="Ավելացնել քանակը"
              disabled={qty >= maxQty}
              onClick={() => setQty(clampQty(qty + 1))}
            >
              <Plus />
            </Button>
          </div>
          {state.errors.qty && (
            <FieldError id="checkout-qty-error">{state.errors.qty}</FieldError>
          )}
        </Field>

        {fields.map((field) => {
          const id = `checkout-${field.name}`;
          const error = state.errors[field.name];
          return (
            <Field key={field.name} data-invalid={error ? true : undefined}>
              <FieldLabel htmlFor={id}>
                {field.label}
                {!field.required && (
                  <span className="font-normal text-muted-foreground">(ոչ պարտադիր)</span>
                )}
              </FieldLabel>
              <Input
                id={id}
                name={field.name}
                type={field.type}
                autoComplete={field.autoComplete}
                required={field.required}
                defaultValue={state.values[field.name] ?? ""}
                className="h-10"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${id}-error` : undefined}
              />
              {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
            </Field>
          );
        })}
      </FieldGroup>

      <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 rounded-2xl bg-muted px-4 py-3 text-sm tabular-nums">
        <dt className="text-muted-foreground">
          {formatMoney(product.price)} × {qty}
        </dt>
        <dd className="text-right">{formatMoney(totals.subtotal)}</dd>
        {sale && sale.percent > 0 && (
          <>
            <dt className="text-muted-foreground">Զեղչ {sale.percent}%</dt>
            <dd className="text-right">−{formatMoney(totals.discount)}</dd>
          </>
        )}
        {isShop && (
          <>
            <dt className="text-muted-foreground">Առաքում</dt>
            <dd className="text-right">
              {product.deliveryFee > 0 ? formatMoney(product.deliveryFee) : "Անվճար"}
            </dd>
          </>
        )}
        <dt className="mt-1 border-t pt-2 text-base font-semibold">Ընդամենը</dt>
        <dd className="mt-1 border-t pt-2 text-right text-base font-semibold" aria-live="polite">
          {formatMoney(totals.orderTotal)}
        </dd>
      </dl>

      {state.formError && <FieldError>{state.formError}</FieldError>}

      <Button type="submit" size="lg" disabled={pending} className="h-11 w-full text-base">
        {pending ? "Ուղարկվում է…" : copy.submit}
      </Button>
    </form>
  );
}
