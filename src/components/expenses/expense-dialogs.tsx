"use client";

import { useActionState, useState, useTransition } from "react";
import { CircleStop, Plus, Trash2 } from "lucide-react";
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
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS } from "@/config/expenses";
import {
  addExpense,
  deleteExpense,
  removeRecurringExpense,
  type ExpenseFormState,
} from "@/lib/expenses/actions";

const INITIAL_STATE: ExpenseFormState = {
  ok: false,
  values: {},
  errors: {},
  formError: null,
};

export function AddExpenseDialog({ today }: { today: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="lg" />}>
        <Plus />
        Ավելացնել ծախս
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ավելացնել ծախս</DialogTitle>
        </DialogHeader>
        {/* Mounted only while open, so each opening starts with a clean form. */}
        <ExpenseForm today={today} onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function ExpenseForm({ today, onSaved }: { today: string; onSaved: () => void }) {
  const [state, formAction, pending] = useActionState(
    async (prev: ExpenseFormState, formData: FormData) => {
      const next = await addExpense(prev, formData);
      if (next.ok) onSaved();
      return next;
    },
    INITIAL_STATE,
  );
  const { values, errors } = state;

  return (
    <form action={formAction} noValidate className="grid gap-4">
      <FieldGroup className="gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={errors.date ? true : undefined}>
            <FieldLabel htmlFor="expense-date">Ամսաթիվ</FieldLabel>
            <Input
              id="expense-date"
              name="date"
              type="date"
              required
              defaultValue={values.date ?? today}
              aria-invalid={errors.date ? true : undefined}
            />
            {errors.date && <FieldError>{errors.date}</FieldError>}
          </Field>
          <Field data-invalid={errors.amount ? true : undefined}>
            <FieldLabel htmlFor="expense-amount">Գումար (֏)</FieldLabel>
            <Input
              id="expense-amount"
              name="amount"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              required
              defaultValue={values.amount ?? ""}
              autoFocus
              aria-invalid={errors.amount ? true : undefined}
            />
            {errors.amount && <FieldError>{errors.amount}</FieldError>}
          </Field>
        </div>

        <Field data-invalid={errors.category ? true : undefined}>
          <FieldLabel htmlFor="expense-category">Կատեգորիա</FieldLabel>
          <select
            id="expense-category"
            name="category"
            required
            defaultValue={values.category ?? EXPENSE_CATEGORIES[0]}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {EXPENSE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {EXPENSE_CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
          {errors.category && <FieldError>{errors.category}</FieldError>}
        </Field>

        <Field data-invalid={errors.description ? true : undefined}>
          <FieldLabel htmlFor="expense-description">
            Նկարագրություն
            <span className="font-normal text-muted-foreground">(ոչ պարտադիր)</span>
          </FieldLabel>
          <Input
            id="expense-description"
            name="description"
            maxLength={200}
            placeholder="Օրինակ՝ սինտեպոն, 5 կգ"
            defaultValue={values.description ?? ""}
            autoComplete="off"
            aria-invalid={errors.description ? true : undefined}
          />
          {errors.description && <FieldError>{errors.description}</FieldError>}
        </Field>

        <label className="flex cursor-pointer items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            name="monthly"
            className="mt-0.5 size-4 accent-[var(--primary)]"
          />
          <span>
            <span className="font-medium">Կրկնել ամեն ամիս</span>
            <span className="block text-muted-foreground">
              Օրինակ՝ վարձակալություն։ Կհաշվվի ամեն ամիս նույն օրը՝ սկսած ընտրված ամսաթվից։
            </span>
          </span>
        </label>
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

export function DeleteExpenseDialog({
  expenseId,
  summary,
}: {
  expenseId: string;
  /** What is being deleted, e.g. "Մարքեթինգ, 5 000 ֏". */
  summary: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirmDelete() {
    startTransition(async () => {
      const result = await deleteExpense(expenseId);
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
            aria-label={`Ջնջել ծախսը՝ ${summary}`}
          />
        }
      >
        <Trash2 />
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Ջնջե՞լ ծախսը</DialogTitle>
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

export function RemoveMonthlyExpenseDialog({
  recurringId,
  summary,
  today,
  stopped,
}: {
  recurringId: string;
  summary: string;
  today: string;
  /** Already ended: only full deletion is offered. */
  stopped: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(mode: "stop" | "delete") {
    startTransition(async () => {
      const result = await removeRecurringExpense(recurringId, mode, today);
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
            aria-label={`Դադարեցնել կամ ջնջել՝ ${summary}`}
          />
        }
      >
        {stopped ? <Trash2 /> : <CircleStop />}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{stopped ? "Ջնջե՞լ ամսական ծախսը" : "Դադարեցնե՞լ ամսական ծախսը"}</DialogTitle>
          <DialogDescription>
            {summary}։{" "}
            {stopped
              ? "Ջնջելու դեպքում նախորդ ամիսների գումարները նույնպես կհանվեն հաշվարկից։"
              : "Դադարեցնելու դեպքում նախորդ ամիսների գումարները կմնան։ Ամբողջությամբ ջնջելու դեպքում դրանք նույնպես կհանվեն հաշվարկից։"}
          </DialogDescription>
        </DialogHeader>
        {error && <FieldError>{error}</FieldError>}
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Չեղարկել
          </DialogClose>
          <Button variant="destructive" disabled={pending} onClick={() => run("delete")}>
            Ջնջել ամբողջությամբ
          </Button>
          {!stopped && (
            <Button disabled={pending} onClick={() => run("stop")}>
              Դադարեցնել
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
