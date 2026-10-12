"use client";

import { useState, useTransition } from "react";
import { Gift, PackagePlus } from "lucide-react";
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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatNumber } from "@/lib/format";
import { adjustStock, type StockChange } from "@/lib/inventory/actions";

const COPY: Record<
  StockChange,
  { button: string; title: string; label: string; submit: string }
> = {
  receive: {
    button: "Մուտք",
    title: "Ավելացնել պահեստ",
    label: "Ստացված քանակ",
    submit: "Ավելացնել",
  },
  gift: {
    button: "Նվեր",
    title: "Դուրս գրել որպես նվեր",
    label: "Նվիրված քանակ",
    submit: "Դուրս գրել",
  },
};

export function StockChangeDialog({
  kind,
  productId,
  title,
  available,
}: {
  kind: StockChange;
  productId: string;
  title: string;
  available: number;
}) {
  const copy = COPY[kind];
  const Icon = kind === "receive" ? PackagePlus : Gift;
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await adjustStock(productId, kind, Number(quantity));
      if (result.ok) setOpen(false);
      else setError(result.error);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setQuantity("");
          setError(null);
        }
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            disabled={kind === "gift" && available === 0}
            aria-label={`${copy.button}՝ ${title}`}
          />
        }
      >
        <Icon />
        {copy.button}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>
            {title}։ Առկա է՝ {formatNumber(available)}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="grid gap-4">
          <Field data-invalid={error ? true : undefined}>
            <FieldLabel htmlFor="stock-change-qty">{copy.label}</FieldLabel>
            <Input
              id="stock-change-qty"
              type="number"
              inputMode="numeric"
              min={1}
              max={kind === "gift" ? available : undefined}
              step={1}
              value={quantity}
              onChange={(event) => setQuantity(event.currentTarget.value)}
              autoFocus
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "stock-change-error" : undefined}
            />
            {error && <FieldError id="stock-change-error">{error}</FieldError>}
          </Field>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Չեղարկել
            </DialogClose>
            <Button type="submit" disabled={pending || !quantity}>
              {pending ? "Պահպանվում է…" : copy.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
