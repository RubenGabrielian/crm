"use client";

import { useState } from "react";
import { Check, Link as LinkIcon, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/format";
import { createSaleLinkQuery } from "@/lib/orders/sale-link-actions";
import type { Product } from "@/lib/products/queries";

export function CopyCheckoutLink({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <LinkIcon />
        Պատճենել հղումը
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Վճարման հղում</DialogTitle>
          <DialogDescription>{product.title}</DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so each opening starts without a sale. */}
        <CopyLinkForm product={product} />
      </DialogContent>
    </Dialog>
  );
}

function CopyLinkForm({ product }: { product: Product }) {
  const productDelivery = Number(product.metadata.delivery_cost);
  const defaultDelivery =
    Number.isFinite(productDelivery) && productDelivery > 0
      ? productDelivery
      : 0;
  const [percent, setPercent] = useState("");
  const [note, setNote] = useState("");
  const [deliveryText, setDeliveryText] = useState(String(defaultDelivery));
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sale = percent.trim() === "" ? 0 : Number(percent);
  const invalid = !Number.isInteger(sale) || sale < 0 || sale > 100;
  const salePrice = invalid
    ? product.price
    : Math.round(product.price * (100 - sale)) / 100;
  const delivery = deliveryText.trim() === "" ? 0 : Number(deliveryText);
  const deliveryInvalid = !Number.isFinite(delivery) || delivery < 0;
  // Only put the fee in the link when it differs from the product's own.
  const deliveryOverride =
    !deliveryInvalid && delivery !== defaultDelivery ? delivery : null;

  async function copy() {
    setError(null);
    let url = `${window.location.origin}/checkout/${product.id}`;
    if (sale > 0 || deliveryOverride !== null || note.trim()) {
      setPending(true);
      const result = await createSaleLinkQuery(
        product.id,
        sale,
        deliveryOverride,
        note,
      );
      setPending(false);
      if (!result.query) {
        setError(result.error);
        return;
      }
      url += result.query;
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard access can be blocked; let the user copy it by hand.
      window.prompt("Պատճենեք հղումը", url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="grid gap-4">
      <Field data-invalid={invalid ? true : undefined}>
        <FieldLabel htmlFor="link-sale">
          Զեղչ, %
          <span className="font-normal text-muted-foreground">
            (ոչ պարտադիր)
          </span>
        </FieldLabel>
        <Input
          id="link-sale"
          type="number"
          inputMode="numeric"
          min={0}
          max={100}
          step={1}
          placeholder="0"
          value={percent}
          onChange={(event) => {
            setPercent(event.currentTarget.value);
            setCopied(false);
          }}
          aria-invalid={invalid ? true : undefined}
        />
        {invalid && <FieldError>Մուտքագրեք 0-ից 100 ամբողջ թիվ</FieldError>}
      </Field>

      <Field data-invalid={deliveryInvalid ? true : undefined}>
        <FieldLabel htmlFor="link-delivery">Առաքման արժեք (֏)</FieldLabel>
        <Input
          id="link-delivery"
          type="number"
          inputMode="numeric"
          min={0}
          step="any"
          value={deliveryText}
          onChange={(event) => {
            setDeliveryText(event.currentTarget.value);
            setCopied(false);
          }}
          aria-invalid={deliveryInvalid ? true : undefined}
          aria-describedby="link-delivery-hint"
        />
        <p id="link-delivery-hint" className="text-xs text-muted-foreground">
          0՝ անվճար առաքում։ Ապրանքի առաքման արժեքը՝{" "}
          {formatMoney(defaultDelivery)}։
        </p>
        {deliveryInvalid && <FieldError>Մուտքագրեք 0 կամ ավելի</FieldError>}
      </Field>

      <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 rounded-2xl bg-muted px-4 py-3 text-sm tabular-nums">
        <dt className="text-muted-foreground">Գինը հղումով</dt>
        <dd className="text-right">
          {sale > 0 && !invalid && (
            <s className="mr-2 text-muted-foreground">
              {formatMoney(product.price)}
            </s>
          )}
          {formatMoney(salePrice)}
        </dd>
        <dt className="text-muted-foreground">Առաքում</dt>
        <dd className="text-right">
          {deliveryInvalid
            ? "—"
            : delivery > 0
              ? formatMoney(delivery)
              : "Անվճար"}
        </dd>
        <dt className="mt-1 border-t pt-2 font-semibold">Ընդամենը (1 հատ)</dt>
        <dd className="mt-1 border-t pt-2 text-right text-base font-semibold">
          {formatMoney(salePrice + (deliveryInvalid ? 0 : delivery))}
        </dd>
      </dl>

      <Field>
        <FieldLabel htmlFor="link-note">
          Նշում ինձ համար
          <span className="font-normal text-muted-foreground">
            (ոչ պարտադիր)
          </span>
        </FieldLabel>
        <textarea
          id="link-note"
          rows={3}
          maxLength={2000}
          placeholder="օր.՝ Instagram, @anna_h, ուզում է կարմիր գույնը"
          value={note}
          onChange={(event) => {
            setNote(event.currentTarget.value);
            setCopied(false);
          }}
          aria-describedby="link-note-hint"
          className="min-h-20 w-full resize-y rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        />
        <p id="link-note-hint" className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="size-3 shrink-0" aria-hidden />
          Հաճախորդը չի տեսնի։ Կավելանա պատվերին որպես մեկնաբանություն։
        </p>
      </Field>

      {error && <FieldError>{error}</FieldError>}

      <DialogFooter>
        <Button onClick={copy} disabled={pending || invalid || deliveryInvalid}>
          {copied ? <Check /> : <LinkIcon />}
          {copied ? "Պատճենվեց" : "Պատճենել հղումը"}
        </Button>
      </DialogFooter>
      <span role="status" className="sr-only">
        {copied ? "Հղումը պատճենվեց" : ""}
      </span>
    </div>
  );
}
