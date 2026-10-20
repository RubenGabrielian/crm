"use client";

import { useActionState, useOptimistic, useState, useTransition } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { cn } from "cn";
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  REINVESTMENT_STATUSES,
  REINVESTMENT_STATUS_LABELS,
  type ReinvestmentStatus,
} from "@/config/reinvestments";
import {
  addReinvestment,
  deleteReinvestment,
  updateReinvestmentStatus,
  type ReinvestmentFormState,
} from "@/lib/reinvestments/actions";
import { useTenant } from "@/lib/tenant/tenant-context";
import { ITEM_LABELS } from "@/lib/tenant/features";

const INITIAL_STATE: ReinvestmentFormState = {
  ok: false,
  values: {},
  errors: {},
  formError: null,
};

const SELECT_CLASS =
  "h-10 w-full rounded-xl border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

// Same meaning as order statuses: amber = not started, blue = under way, green = done.
const STATUS_STYLES: Record<ReinvestmentStatus, string> = {
  planned: "bg-amber-100 text-amber-900",
  in_progress: "bg-blue-100 text-blue-900",
  done: "bg-emerald-100 text-emerald-900",
};

export function AddReinvestmentDialog({
  today,
  products,
}: {
  today: string;
  products: { id: string; title: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="lg" />}>
        <Plus />
        Ավելացնել վերաներդրում
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ավելացնել վերաներդրում</DialogTitle>
        </DialogHeader>
        {/* Mounted only while open, so each opening starts with a clean form. */}
        <ReinvestmentForm today={today} products={products} onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function ReinvestmentForm({
  today,
  products,
  onSaved,
}: {
  today: string;
  products: { id: string; title: string }[];
  onSaved: () => void;
}) {
  const { businessType } = useTenant();
  const [state, formAction, pending] = useActionState(
    async (prev: ReinvestmentFormState, formData: FormData) => {
      const next = await addReinvestment(prev, formData);
      if (next.ok) onSaved();
      return next;
    },
    INITIAL_STATE,
  );
  const { values, errors } = state;

  return (
    <form action={formAction} noValidate className="grid gap-4">
      <FieldGroup className="gap-4">
        <Field data-invalid={errors.purpose ? true : undefined}>
          <FieldLabel htmlFor="reinvestment-purpose">Ինչի համար</FieldLabel>
          <Input
            id="reinvestment-purpose"
            name="purpose"
            required
            maxLength={200}
            placeholder="Օրինակ՝ նոր խմբաքանակի պատվեր"
            defaultValue={values.purpose ?? ""}
            autoFocus
            autoComplete="off"
            aria-invalid={errors.purpose ? true : undefined}
          />
          {errors.purpose && <FieldError>{errors.purpose}</FieldError>}
        </Field>

        <Field data-invalid={errors.product_id ? true : undefined}>
          <FieldLabel htmlFor="reinvestment-product">
            {ITEM_LABELS[businessType]}
            <span className="font-normal text-muted-foreground">(ոչ պարտադիր)</span>
          </FieldLabel>
          <select
            id="reinvestment-product"
            name="product_id"
            defaultValue={values.product_id ?? ""}
            className={SELECT_CLASS}
          >
            <option value="">Ընդհանուր, առանց ապրանքի</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.title}
              </option>
            ))}
          </select>
          {errors.product_id && <FieldError>{errors.product_id}</FieldError>}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={errors.amount ? true : undefined}>
            <FieldLabel htmlFor="reinvestment-amount">Գումար (֏)</FieldLabel>
            <Input
              id="reinvestment-amount"
              name="amount"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              required
              defaultValue={values.amount ?? ""}
              aria-invalid={errors.amount ? true : undefined}
            />
            {errors.amount && <FieldError>{errors.amount}</FieldError>}
          </Field>
          <Field data-invalid={errors.date ? true : undefined}>
            <FieldLabel htmlFor="reinvestment-date">Ամսաթիվ</FieldLabel>
            <Input
              id="reinvestment-date"
              name="date"
              type="date"
              required
              defaultValue={values.date ?? today}
              aria-invalid={errors.date ? true : undefined}
            />
            {errors.date && <FieldError>{errors.date}</FieldError>}
          </Field>
        </div>

        <Field data-invalid={errors.status ? true : undefined}>
          <FieldLabel htmlFor="reinvestment-status">Կարգավիճակ</FieldLabel>
          <select
            id="reinvestment-status"
            name="status"
            defaultValue={values.status ?? REINVESTMENT_STATUSES[0]}
            className={SELECT_CLASS}
          >
            {REINVESTMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {REINVESTMENT_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          {errors.status && <FieldError>{errors.status}</FieldError>}
        </Field>
      </FieldGroup>

      {state.formError && <FieldError>{state.formError}</FieldError>}

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

export function ReinvestmentStatusSelect({
  id,
  status,
  label,
}: {
  id: string;
  status: ReinvestmentStatus;
  /** Accessible name: what this investment is for. */
  label: string;
}) {
  const [pending, startTransition] = useTransition();
  // Shows the new status immediately; falls back to the saved one on failure.
  const [shown, setShown] = useOptimistic(status);
  const [error, setError] = useState<string | null>(null);

  function change(next: ReinvestmentStatus) {
    setError(null);
    startTransition(async () => {
      setShown(next);
      const result = await updateReinvestmentStatus(id, next);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <span className="relative inline-flex">
        <select
          aria-label={`Կարգավիճակ՝ ${label}`}
          value={shown}
          disabled={pending}
          onChange={(event) => change(event.currentTarget.value as ReinvestmentStatus)}
          className={cn(
            "cursor-pointer appearance-none rounded-full py-1 pr-7 pl-2.5 text-xs font-medium outline-none",
            "focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-70",
            STATUS_STYLES[shown],
          )}
        >
          {REINVESTMENT_STATUSES.map((value) => (
            <option key={value} value={value}>
              {REINVESTMENT_STATUS_LABELS[value]}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 opacity-70"
        />
      </span>
      {error && (
        <span role="alert" className="max-w-40 text-xs whitespace-normal text-destructive">
          {error}
        </span>
      )}
    </span>
  );
}

export function DeleteReinvestmentDialog({ id, summary }: { id: string; summary: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirmDelete() {
    startTransition(async () => {
      const result = await deleteReinvestment(id);
      if (result.ok) setOpen(false);
      else setError(result.error);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive"
            aria-label={`Ջնջել՝ ${summary}`}
          />
        }
      >
        <Trash2 />
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Ջնջե՞լ վերաներդրումը</DialogTitle>
          <DialogDescription>{summary}</DialogDescription>
        </DialogHeader>
        {error && <FieldError>{error}</FieldError>}
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Չեղարկել
          </DialogClose>
          <Button variant="destructive" disabled={pending} onClick={confirmDelete}>
            {pending ? "Ջնջվում է…" : "Ջնջել"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
