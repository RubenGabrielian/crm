"use client";

import { useState, useTransition } from "react";
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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatNumber } from "@/lib/format";
import { setStockCounts } from "@/lib/inventory/actions";

type Counts = { available: number; sold: number; gifted: number };

const FIELDS: { name: keyof Counts; label: string }[] = [
  { name: "available", label: "Առկա քանակ" },
  { name: "sold", label: "Վաճառքներից դուրս գրված" },
  { name: "gifted", label: "Նվերներից դուրս գրված" },
];

/** Correct a product's warehouse numbers after a count. */
export function EditStockDialog({
  productId,
  title,
  counts,
}: {
  productId: string;
  title: string;
  counts: Counts;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Խմբագրել քանակները՝ ${title}`}
          />
        }
      >
        <Pencil />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Խմբագրել քանակները</DialogTitle>
          <DialogDescription>{title}</DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so each opening starts from the saved numbers. */}
        <EditStockForm
          productId={productId}
          counts={counts}
          onSaved={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function EditStockForm({
  productId,
  counts,
  onSaved,
}: {
  productId: string;
  counts: Counts;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<Record<keyof Counts, string>>({
    available: String(counts.available),
    sold: String(counts.sold),
    gifted: String(counts.gifted),
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const number = (name: keyof Counts) => Number(values[name]) || 0;
  const used = number("sold") + number("gifted");
  const received = used + number("available");

  function save(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await setStockCounts(productId, {
        available: Number(values.available),
        sold: Number(values.sold),
        gifted: Number(values.gifted),
      });
      if (result.ok) onSaved();
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={save} noValidate className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        {FIELDS.map((field, index) => (
          <Field key={field.name}>
            <FieldLabel
              htmlFor={`stock-${field.name}`}
              className="leading-snug"
            >
              {field.label}
            </FieldLabel>
            <Input
              id={`stock-${field.name}`}
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={values[field.name]}
              autoFocus={index === 0}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setValues((current) => ({ ...current, [field.name]: value }));
              }}
              className="tabular-nums"
            />
          </Field>
        ))}
      </div>

      <dl
        aria-live="polite"
        className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 rounded-2xl bg-muted px-4 py-3 text-sm tabular-nums"
      >
        <dt className="text-muted-foreground">Ընդհանուր օգտագործված</dt>
        <dd className="text-right font-semibold">{formatNumber(used)}</dd>
        <dt className="text-muted-foreground">Մուտքագրված ընդհանուր քանակ</dt>
        <dd className="text-right font-semibold">{formatNumber(received)}</dd>
      </dl>
      <p className="-mt-2 text-xs text-muted-foreground">
        Նոր պատվերները կշարունակեն ավելանալ «Վաճառք»-ին այս թվի վրա։
      </p>

      {error && <FieldError>{error}</FieldError>}

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          Չեղարկել
        </DialogClose>
        <Button type="submit" disabled={pending}>
          {pending ? "Պահպանվում է…" : "Պահպանել"}
        </Button>
      </DialogFooter>
    </form>
  );
}
