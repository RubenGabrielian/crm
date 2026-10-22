"use client";

import { Fragment, useActionState, useState } from "react";
import { Package, Plus, User, Wallet, X, type LucideIcon } from "lucide-react";
import { cn } from "cn";
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
import { SelectMenu } from "@/components/ui/select-menu";
import type { CustomerOption } from "@/lib/customers/actions";
import { formatMoney } from "@/lib/format";
import { useNavLabels } from "@/lib/navigation/labels-context";
import { createManualOrder, type OrderFormState } from "@/lib/orders/actions";
import { computeOrderTotals } from "@/lib/orders/totals";
import { useRefreshNewOrders } from "@/components/layout/new-orders";
import { ITEM_LABELS } from "@/lib/tenant/features";
import { useTenant } from "@/lib/tenant/tenant-context";
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from "@/config/payments";
import { CustomerPicker } from "./customer-picker";

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
      {/* A fixed height: centered dialogs re-center (and jump) whenever their
          content grows or shrinks. Changes now happen inside, and the form
          row fills the rest so the footer sits at the bottom. */}
      <DialogContent
        className={cn(
          "sm:max-w-2xl lg:max-w-5xl",
          // With nothing to order, the form is a short note: no fixed height.
          products.length > 0 &&
            "h-[min(56rem,calc(100dvh-2rem))] grid-rows-[auto_minmax(auto,1fr)]",
        )}
      >
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
  // An existing customer picked from the list fills the fields below.
  const [customer, setCustomer] = useState<CustomerOption | null>(null);
  const [comment, setComment] = useState("");
  const { commentLabel } = useNavLabels();

  function pickCustomer(next: CustomerOption | null) {
    setCustomer(next);
    setName(next?.name ?? "");
    setPhone(next?.phone ?? "");
    setEmail(next?.email ?? "");
    setAddress(next?.lastAddress ?? "");
    setComment(next?.comment ?? "");
  }
  // Saved on the customer only when changed, so an untouched field never
  // overwrites a comment written elsewhere.
  const commentChanged = comment.trim() !== (customer?.comment ?? "").trim();
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
    const price =
      line.price === ""
        ? (product?.price ?? 0)
        : Math.max(Number(line.price) || 0, 0);
    if (product) used.set(product.id, (used.get(product.id) ?? 0) + quantity);
    const overStock =
      !preorder &&
      product?.stock != null &&
      (used.get(product.id) ?? 0) > product.stock;
    return { line, product, quantity, price, overStock };
  });
  const chosen = rows.filter((row) => row.product);
  const deliveryFee =
    chosen.find((row) => row.product!.deliveryFee > 0)?.product!.deliveryFee ??
    0;
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
    <form
      action={formAction}
      noValidate
      className="flex min-w-0 flex-col gap-5"
    >
      <input
        type="hidden"
        name="lines"
        value={JSON.stringify(
          lines.map(({ productId, qty, price }) => ({ productId, qty, price })),
        )}
      />

      {/* Phones: one column in reading order. Wide screens: the order on the
          left, the customer in its own column on the right. */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start lg:gap-6">
        <Section
          icon={Package}
          title={
            businessType === "mixed"
              ? "Ապրանքներ և ծառայություններ"
              : isShop
                ? "Ապրանքներ"
                : "Դասընթացներ"
          }
          className="lg:col-start-1 lg:row-start-1"
        >
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
                    <SelectMenu
                      aria-label={`${itemLabel} ${index + 1}`}
                      value={line.productId}
                      onChange={(productId) => {
                        const next = products.find(
                          (item) => item.id === productId,
                        );
                        updateLine(line.key, {
                          productId,
                          price: next ? String(next.price) : "",
                        });
                      }}
                      invalid={Boolean(productError)}
                      options={products.map((item) => ({
                        value: item.id,
                        label: item.title,
                        hint:
                          item.stock === 0
                            ? "սպառված է"
                            : formatMoney(item.price),
                        disabled: item.stock === 0 && !preorder,
                      }))}
                    />
                    {productError && <FieldError>{productError}</FieldError>}
                  </Field>
                  <Field data-invalid={qtyError ? true : undefined}>
                    <Input
                      aria-label="Քանակ"
                      type="number"
                      className="tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
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
                      className="tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      inputMode="decimal"
                      min={0}
                      step="any"
                      value={line.price}
                      onChange={(event) =>
                        updateLine(line.key, {
                          price: event.currentTarget.value,
                        })
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
        </Section>

        <Section
          icon={User}
          title="Հաճախորդ"
          className="lg:col-start-2 lg:row-span-3 lg:row-start-1"
        >
          <CustomerPicker picked={customer} onPick={pickCustomer} />
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
          <div className={isShop ? "grid gap-4 sm:grid-cols-2" : "grid gap-4"}>
            <TextField
              name="email"
              label="Էլ. հասցե"
              type="email"
              optional
              value={email}
              onChange={setEmail}
              error={errors.email}
            />
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
          </div>
          <Field>
            <FieldLabel htmlFor="new-order-customer-comment">
              {commentLabel}
              <span className="font-normal text-muted-foreground">
                (ոչ պարտադիր)
              </span>
            </FieldLabel>
            <textarea
              id="new-order-customer-comment"
              name="customer_comment"
              rows={2}
              maxLength={2000}
              value={comment}
              onChange={(event) => setComment(event.currentTarget.value)}
              placeholder="օր.՝ սիրում է կարմիր գույնը, զանգել երեկոյան"
              aria-describedby="new-order-customer-comment-hint"
              className="min-h-20 w-full resize-y rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            />
            <p
              id="new-order-customer-comment-hint"
              className="text-xs text-muted-foreground"
            >
              Կպահվի հաճախորդի քարտում (CRM)։
            </p>
            {commentChanged && (
              <input type="hidden" name="customer_comment_changed" value="1" />
            )}
          </Field>
        </Section>

        <Section
          icon={Wallet}
          title="Վճարում և մանրամասներ"
          className="lg:col-start-1 lg:row-start-2"
        >
          <div className="grid gap-4 sm:grid-cols-[7rem_1fr]">
            <TextField
              name="discount_percent"
              className="tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
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
            <TextField
              name="scheduled_at"
              label="Օր և ժամ"
              optional
              type="datetime-local"
              value={scheduledAt}
              onChange={setScheduledAt}
              error={errors.scheduled_at}
            />
          </div>
          <Field>
            <FieldLabel htmlFor="new-order-source">
              Աղբյուր
              <span className="font-normal text-muted-foreground">
                (ոչ պարտադիր)
              </span>
            </FieldLabel>
            <SelectMenu
              id="new-order-source"
              name="source"
              value={source}
              onChange={setSource}
              emptyOption="Աղբյուր չկա"
              placeholder="Աղբյուր չկա"
              options={sources.map((item) => ({ value: item, label: item }))}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="new-order-payment-method">
                Վճարման եղանակ
              </FieldLabel>
              <SelectMenu
                id="new-order-payment-method"
                name="payment_method"
                value={paymentMethod}
                onChange={setPaymentMethod}
                emptyOption="Նշված չէ"
                placeholder="Նշված չէ"
                options={PAYMENT_METHODS.map((method) => ({
                  value: method,
                  label: PAYMENT_METHOD_LABELS[method],
                }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="new-order-paid">Վճարում</FieldLabel>
              <SelectMenu
                id="new-order-paid"
                name="paid"
                value={paid}
                onChange={setPaid}
                options={[
                  { value: "no", label: "Չվճարված", dot: "bg-red-500" },
                  { value: "yes", label: "Վճարված", dot: "bg-emerald-500" },
                ]}
              />
            </Field>
          </div>
        </Section>

        <div className="lg:col-start-1 lg:row-start-3">
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
                  <dd className="text-right">
                    {formatMoney(price * quantity)}
                  </dd>
                </Fragment>
              ))}
              {totals.discount > 0 && (
                <>
                  <dt className="text-muted-foreground">Զեղչ</dt>
                  <dd className="text-right">
                    −{formatMoney(totals.discount)}
                  </dd>
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
        </div>
      </div>

      {state.formError && <FieldError>{state.formError}</FieldError>}

      <DialogFooter className="sticky bottom-0 z-10 -mx-6 -mb-6 mt-auto border-t bg-popover px-6 pt-4 pb-6 sm:items-center">
        {chosen.length > 0 && (
          <p className="text-sm text-muted-foreground sm:mr-auto">
            Ընդամենը՝{" "}
            <span className="text-base font-semibold text-foreground tabular-nums">
              {formatMoney(totals.orderTotal)}
            </span>
          </p>
        )}
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

/** A titled group of fields inside the order form. */
function Section({
  icon: Icon,
  title,
  className,
  children,
}: {
  icon: LucideIcon;
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        // One column that never grows past the card (grid's default "auto"
        // column widens to fit the content and spills out).
        "grid min-w-0 grid-cols-1 content-start gap-4 rounded-2xl border bg-card/60 p-4",
        className,
      )}
    >
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-3.5" aria-hidden />
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}
