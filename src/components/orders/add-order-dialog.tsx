"use client";

import { Fragment, useActionState, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/format";
import { createManualOrder, type OrderFormState } from "@/lib/orders/actions";
import { computeOrderTotals } from "@/lib/orders/totals";
import { useRefreshNewOrders } from "@/components/layout/new-orders";
import { ITEM_LABELS } from "@/lib/tenant/features";
import { useTenant } from "@/lib/tenant/tenant-context";
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from "@/config/payments";

export type OrderProductOption = {
  id: string;
  title: string;
  price: number;
  /** null = stock is not tracked. */
  stock: number | null;
  deliveryFee: number;
};

const INITIAL_STATE: OrderFormState = {
  ok: false,
  values: {},
  errors: {},
  formError: null,
};

const SELECT_CLASS =
  "h-10 w-full rounded-xl border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive";

export function AddOrderDialog({
  products,
  sources,
}: {
  products: OrderProductOption[];
  sources: string[];
}) {
  const { businessType } = useTenant();
  const [open, setOpen] = useState(false);
  const title =
    businessType === "service" ? "Ավելացնել գրանցում" : "Ավելացնել պատվեր";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="lg" />}>
        <Plus />
        {title}
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {/* Mounted only while open, so each opening starts with a clean form. */}
        <AddOrderForm
          products={products}
          sources={sources}
          onSaved={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

type Line = { key: number; productId: string; qty: string; price: string };

function AddOrderForm({
  products,
  sources,
  onSaved,
}: {
  products: OrderProductOption[];
  sources: string[];
  onSaved: () => void;
}) {
  const { businessType } = useTenant();
  const isShop = businessType !== "service";
  const itemLabel = ITEM_LABELS[businessType];

  const refreshNewOrders = useRefreshNewOrders();
  const [state, formAction, pending] = useActionState(
    async (prev: OrderFormState, formData: FormData) => {
      const next = await createManualOrder(prev, formData);
      if (next.ok) {
        refreshNewOrders();
        onSaved();
      }
      return next;
    },
    INITIAL_STATE,
  );
  const { errors } = state;

  // Controlled, so nothing is lost when validation fails and the total is live.
  const [lines, setLines] = useState<Line[]>([
    { key: 0, productId: "", qty: "1", price: "" },
  ]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [source, setSource] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paid, setPaid] = useState("no");
  const [discount, setDiscount] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  // A preorder takes no stock, so out-of-stock items can be picked.
  const [preorder, setPreorder] = useState(false);
  const tracksStock = products.some((item) => item.stock !== null);

  function updateLine(key: number, change: Partial<Line>) {
    setLines((current) =>
      current.map((line) => (line.key === key ? { ...line, ...change } : line)),
    );
  }

  // Totals and stock, line by line; delivery is paid once per visit.
  const discountPercent = Math.min(Math.max(Number(discount) || 0, 0), 100);
  const used = new Map<string, number>();
  const rows = lines.map((line) => {
    const product = products.find((item) => item.id === line.productId);
    const quantity = Math.max(Math.trunc(Number(line.qty)) || 0, 0);
    const price = line.price === "" ? (product?.price ?? 0) : Math.max(Number(line.price) || 0, 0);
    if (product) used.set(product.id, (used.get(product.id) ?? 0) + quantity);
    const overStock =
      !preorder &&
      product?.stock != null &&
      (used.get(product.id) ?? 0) > product.stock;
    return { line, product, quantity, price, overStock };
  });
  const chosen = rows.filter((row) => row.product);
  const deliveryFee = chosen.find((row) => row.product!.deliveryFee > 0)?.product!.deliveryFee ?? 0;
  const totals = computeOrderTotals({
    qty: 1,
    unitPrice: chosen.reduce((sum, row) => sum + row.quantity * row.price, 0),
    discountPercent,
    discountAmount: 0,
    deliveryFee,
  });
  const overStock = rows.some((row) => row.overStock);

  if (products.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {businessType === "mixed"
          ? "Նախ ավելացրեք ապրանք կամ ծառայություն «Կատալոգ» բաժնում։"
          : isShop
            ? "Նախ ավելացրեք ապրանք «Ապրանքներ» բաժնում։"
            : "Նախ ավելացրեք դասընթաց «Դասընթացներ» բաժնում։"}
      </p>
    );
  }

  return (
    <form action={formAction} noValidate className="grid gap-4">
      <input
        type="hidden"
        name="lines"
        value={JSON.stringify(
          lines.map(({ productId, qty, price }) => ({ productId, qty, price })),
        )}
      />

      <fieldset className="grid gap-3">
        <legend className="sr-only">{itemLabel}</legend>
        <div
          aria-hidden
          className="-mb-1 grid grid-cols-[1fr_4.5rem_6.5rem_2.25rem] gap-2 text-sm font-medium"
        >
          <span>{itemLabel}</span>
          <span>Քանակ</span>
          <span>Գին, ֏</span>
        </div>
        {rows.map(({ line, product, overStock: lineOver }, index) => {
          const productError = errors[`line-${index}-product`];
          const qtyError =
            errors[`line-${index}-qty`] ??
            (lineOver
              ? `Առկա է ${product?.stock}։ Նշեք «Նախապատվեր»։`
              : undefined);
          const priceError = errors[`line-${index}-price`];
          return (
            <div
              key={line.key}
              className="grid grid-cols-[1fr_4.5rem_6.5rem_2.25rem] items-start gap-2"
            >
              <Field data-invalid={productError ? true : undefined}>
                <select
                  aria-label={`${itemLabel} ${index + 1}`}
                  value={line.productId}
                  onChange={(event) => {
                    const next = products.find(
                      (item) => item.id === event.currentTarget.value,
                    );
                    updateLine(line.key, {
                      productId: event.currentTarget.value,
                      price: next ? String(next.price) : "",
                    });
                  }}
                  aria-invalid={productError ? true : undefined}
                  className={SELECT_CLASS}
                >
                  <option value="" disabled>
                    Ընտրեք
                  </option>
                  {products.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                      disabled={item.stock === 0 && !preorder}
                    >
                      {item.title}
                      {item.stock === 0 ? " (սպառված է)" : ""}
                    </option>
                  ))}
                </select>
                {productError && <FieldError>{productError}</FieldError>}
              </Field>
              <Field data-invalid={qtyError ? true : undefined}>
                <Input
                  aria-label="Քանակ"
                  type="number"
                  min={1}
                  step={1}
                  value={line.qty}
                  onChange={(event) =>
                    updateLine(line.key, { qty: event.currentTarget.value })
                  }
                  aria-invalid={qtyError ? true : undefined}
                />
                {qtyError && <FieldError>{qtyError}</FieldError>}
              </Field>
              <Field data-invalid={priceError ? true : undefined}>
                <Input
                  aria-label="Գին, ֏"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  value={line.price}
                  onChange={(event) =>
                    updateLine(line.key, { price: event.currentTarget.value })
                  }
                  aria-invalid={priceError ? true : undefined}
                />
                {priceError && <FieldError>{priceError}</FieldError>}
              </Field>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Հեռացնել տողը"
                disabled={lines.length === 1}
                onClick={() =>
                  setLines((current) =>
                    current.filter((item) => item.key !== line.key),
                  )
                }
              >
                <X />
              </Button>
            </div>
          );
        })}
        <Button
          type="button"
          variant="outline"
          className="justify-self-start"
          onClick={() =>
            setLines((current) => [
              ...current,
              {
                key: Math.max(...current.map((line) => line.key)) + 1,
                productId: "",
                qty: "1",
                price: "",
              },
            ])
          }
        >
          <Plus />
          {businessType === "mixed"
            ? "Ավելացնել ևս ապրանք կամ ծառայություն"
            : "Ավելացնել ևս մեկը"}
        </Button>
      </fieldset>

      {tracksStock && (
        <label className="flex cursor-pointer items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            name="preorder"
            checked={preorder}
            onChange={(event) => setPreorder(event.currentTarget.checked)}
            className="mt-0.5 size-4 accent-[var(--primary)]"
          />
          <span>
            <span className="font-medium">Նախապատվեր</span>
            <span className="block text-muted-foreground">
              Ապրանքը դեռ չկա կամ սպառված է։ Պահեստից կհանվի, երբ պատվերը
              դարձնեք «Հաստատված» կամ «Առաքված»։
            </span>
          </span>
        </label>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          name="name"
          label="Անուն Ազգանուն"
          value={name}
          onChange={setName}
          error={errors.name}
        />
        <TextField
          name="phone"
          label="Հեռախոս"
          type="tel"
          value={phone}
          onChange={setPhone}
          error={errors.phone}
        />
      </div>

      <div
        className={isShop ? "grid gap-4 sm:grid-cols-[1fr_7rem]" : undefined}
      >
        {isShop && (
          <TextField
            name="address"
            label="Հասցե"
            optional
            value={address}
            onChange={setAddress}
            error={errors.address}
          />
        )}
        <TextField
          name="discount_percent"
          label="Զեղչ, %"
          type="number"
          inputMode="decimal"
          min={0}
          max={100}
          placeholder="0"
          value={discount}
          onChange={setDiscount}
          error={errors.discount_percent}
        />
      </div>

      <TextField
        name="scheduled_at"
        label="Օր և ժամ"
        optional
        type="datetime-local"
        value={scheduledAt}
        onChange={setScheduledAt}
        error={errors.scheduled_at}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          name="email"
          label="Էլ. հասցե"
          type="email"
          optional
          value={email}
          onChange={setEmail}
          error={errors.email}
        />
        <Field>
          <FieldLabel htmlFor="new-order-source">
            Աղբյուր
            <span className="font-normal text-muted-foreground">
              (ոչ պարտադիր)
            </span>
          </FieldLabel>
          <select
            id="new-order-source"
            name="source"
            value={source}
            onChange={(event) => setSource(event.currentTarget.value)}
            className={SELECT_CLASS}
          >
            <option value="">Աղբյուր չկա</option>
            {sources.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="new-order-payment-method">
            Վճարման եղանակ
          </FieldLabel>
          <select
            id="new-order-payment-method"
            name="payment_method"
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.currentTarget.value)}
            className={SELECT_CLASS}
          >
            <option value="">Նշված չէ</option>
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {PAYMENT_METHOD_LABELS[method]}
              </option>
            ))}
          </select>
        </Field>
        <Field>
          <FieldLabel htmlFor="new-order-paid">Վճարում</FieldLabel>
          <select
            id="new-order-paid"
            name="paid"
            value={paid}
            onChange={(event) => setPaid(event.currentTarget.value)}
            className={SELECT_CLASS}
          >
            <option value="no">Չվճարված</option>
            <option value="yes">Վճարված</option>
          </select>
        </Field>
      </div>

      {chosen.length > 0 && (
        <dl
          aria-live="polite"
          className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 rounded-2xl bg-muted px-4 py-3 text-sm tabular-nums"
        >
          {chosen.map(({ line, product, quantity, price }) => (
            <Fragment key={line.key}>
              <dt className="truncate text-muted-foreground">
                {product!.title}, {formatMoney(price)} × {quantity}
              </dt>
              <dd className="text-right">{formatMoney(price * quantity)}</dd>
            </Fragment>
          ))}
          {totals.discount > 0 && (
            <>
              <dt className="text-muted-foreground">Զեղչ</dt>
              <dd className="text-right">−{formatMoney(totals.discount)}</dd>
            </>
          )}
          {isShop && deliveryFee > 0 && (
            <>
              <dt className="text-muted-foreground">Առաքում</dt>
              <dd className="text-right">{formatMoney(deliveryFee)}</dd>
            </>
          )}
          <dt className="mt-1 border-t pt-2 text-base font-semibold">
            Ընդամենը
          </dt>
          <dd className="mt-1 border-t pt-2 text-right text-base font-semibold">
            {formatMoney(totals.orderTotal)}
          </dd>
        </dl>
      )}

      {state.formError && <FieldError>{state.formError}</FieldError>}

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          Չեղարկել
        </DialogClose>
        <Button type="submit" disabled={pending || overStock}>
          {pending ? "Պահպանվում է…" : "Պահպանել"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function TextField({
  name,
  label,
  optional,
  value,
  onChange,
  error,
  ...input
}: {
  name: string;
  label: string;
  optional?: boolean;
  value: string;
  onChange: (value: string) => void;
  error?: string;
} & Omit<React.ComponentProps<typeof Input>, "name" | "value" | "onChange">) {
  const id = `new-order-${name}`;
  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>
        {label}
        {optional && (
          <span className="font-normal text-muted-foreground">
            (ոչ պարտադիր)
          </span>
        )}
      </FieldLabel>
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
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </Field>
  );
}
