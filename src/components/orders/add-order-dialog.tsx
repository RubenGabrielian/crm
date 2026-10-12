"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
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
import { useTenant } from "@/lib/tenant/tenant-context";

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
  const title = businessType === "ecommerce" ? "Ավելացնել պատվեր" : "Ավելացնել գրանցում";

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
        <AddOrderForm products={products} sources={sources} onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

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
  const isShop = businessType === "ecommerce";

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
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("1");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [source, setSource] = useState("");

  const product = products.find((item) => item.id === productId);
  const quantity = Math.max(Math.trunc(Number(qty)) || 0, 0);
  const totals = computeOrderTotals({
    qty: quantity,
    unitPrice: product?.price ?? 0,
    discountPercent: 0,
    discountAmount: 0,
    deliveryFee: product?.deliveryFee ?? 0,
  });
  const overStock = product?.stock != null && quantity > product.stock;

  if (products.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {isShop
          ? "Նախ ավելացրեք ապրանք «Ապրանքներ» բաժնում։"
          : "Նախ ավելացրեք դասընթաց «Դասընթացներ» բաժնում։"}
      </p>
    );
  }

  return (
    <form action={formAction} noValidate className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
        <Field data-invalid={errors.product_id ? true : undefined}>
          <FieldLabel htmlFor="new-order-product">{isShop ? "Ապրանք" : "Դասընթաց"}</FieldLabel>
          <select
            id="new-order-product"
            name="product_id"
            required
            value={productId}
            onChange={(event) => setProductId(event.currentTarget.value)}
            aria-invalid={errors.product_id ? true : undefined}
            className={SELECT_CLASS}
          >
            <option value="" disabled>
              Ընտրեք
            </option>
            {products.map((item) => (
              <option key={item.id} value={item.id} disabled={item.stock === 0}>
                {item.title}, {formatMoney(item.price)}
                {item.stock === 0 ? " (սպառված է)" : ""}
              </option>
            ))}
          </select>
          {errors.product_id && <FieldError>{errors.product_id}</FieldError>}
        </Field>
        <TextField
          name="qty"
          label="Քանակ"
          type="number"
          min={1}
          max={product?.stock ?? undefined}
          step={1}
          value={qty}
          onChange={setQty}
          error={
            errors.qty ?? (overStock ? `Առկա է միայն ${product?.stock}` : undefined)
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="name" label="Անուն Ազգանուն" value={name} onChange={setName} error={errors.name} />
        <TextField name="phone" label="Հեռախոս" type="tel" value={phone} onChange={setPhone} error={errors.phone} />
      </div>

      {isShop && (
        <TextField name="address" label="Հասցե" optional value={address} onChange={setAddress} error={errors.address} />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="email" label="Էլ. հասցե" type="email" optional value={email} onChange={setEmail} error={errors.email} />
        <Field>
          <FieldLabel htmlFor="new-order-source">
            Աղբյուր
            <span className="font-normal text-muted-foreground">(ոչ պարտադիր)</span>
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

      {product && (
        <dl
          aria-live="polite"
          className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 rounded-2xl bg-muted px-4 py-3 text-sm tabular-nums"
        >
          <dt className="text-muted-foreground">
            {formatMoney(product.price)} × {quantity}
          </dt>
          <dd className="text-right">{formatMoney(totals.productTotal)}</dd>
          {isShop && (
            <>
              <dt className="text-muted-foreground">Առաքում</dt>
              <dd className="text-right">{formatMoney(product.deliveryFee)}</dd>
            </>
          )}
          <dt className="mt-1 border-t pt-2 text-base font-semibold">Ընդամենը</dt>
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
        {optional && <span className="font-normal text-muted-foreground">(ոչ պարտադիր)</span>}
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
