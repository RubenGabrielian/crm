"use client";

import { useState } from "react";
import { Check, Link as LinkIcon } from "lucide-react";
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
  const [percent, setPercent] = useState("");
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sale = percent.trim() === "" ? 0 : Number(percent);
  const invalid = !Number.isInteger(sale) || sale < 0 || sale > 100;
  const salePrice = invalid ? product.price : Math.round(product.price * (100 - sale)) / 100;

  async function copy() {
    setError(null);
    let url = `${window.location.origin}/checkout/${product.id}`;
    if (sale > 0) {
      setPending(true);
      const result = await createSaleLinkQuery(product.id, sale);
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
          Զեղչ, %<span className="font-normal text-muted-foreground">(ոչ պարտադիր)</span>
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

      <p className="flex items-baseline justify-between gap-3 rounded-2xl bg-muted px-4 py-3 text-sm">
        <span className="text-muted-foreground">Գինը հղումով</span>
        <span className="tabular-nums">
          {sale > 0 && !invalid && (
            <s className="mr-2 text-muted-foreground">{formatMoney(product.price)}</s>
          )}
          <span className="text-base font-semibold">{formatMoney(salePrice)}</span>
        </span>
      </p>

      {error && <FieldError>{error}</FieldError>}

      <DialogFooter>
        <Button onClick={copy} disabled={pending || invalid}>
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
