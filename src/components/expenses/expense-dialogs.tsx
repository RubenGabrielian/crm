"use client";

import { useActionState, useState, useTransition } from "react";
import { CircleStop, Plus, Trash2 } from "lucide-react";
import { cn } from "cn";
import { UpgradePrompt } from "@/components/billing/pro-gate";
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
  COST_TYPES,
  COST_TYPE_LABELS,
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  defaultCostType,
} from "@/config/expenses";
import { FREE_EXPENSE_LIMIT } from "@/lib/billing/limits";
import {
  addExpense,
  deleteExpense,
  removeRecurringExpense,
  type ExpenseFormState,
} from "@/lib/expenses/actions";

const SELECT_CLASS =
  "h-10 w-full rounded-xl border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

const INITIAL_STATE: ExpenseFormState = {
  ok: false,
  values: {},
  errors: {},
  formError: null,
};

export function AddExpenseDialog({
  today,
  limitReached = false,
}: {
  today: string;
  /** A free account used up its expenses: the dialog asks to upgrade instead. */
  limitReached?: boolean;
}) {
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
        {limitReached ? (
          <UpgradePrompt
            compact
            title="Ավելացրու անսահմանափակ ծախսեր"
            description={`Անվճար տարբերակում կարելի է ավելացնել ${FREE_EXPENSE_LIMIT} ծախս։ Ակտիվացրու Numa Pro-ն՝ ավելին ավելացնելու համար։`}
          />
        ) : (
          // Mounted only while open, so each opening starts with a clean form.
          <ExpenseForm today={today} onSaved={() => setOpen(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ExpenseForm({
  today,
  onSaved,
}: {
  today: string;
  onSaved: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    async (prev: ExpenseFormState, formData: FormData) => {
      const next = await addExpense(prev, formData);
      if (next.ok) onSaved();
      return next;
    },
    INITIAL_STATE,
  );
  const { values, errors } = state;
  // Monthly expenses have no paid/unpaid status: each month's charge is counted.
  const [monthly, setMonthly] = useState(false);
  // The type follows the category until the admin picks one by hand.
  const [category, setCategory] = useState<string>(
    values.category ?? EXPENSE_CATEGORIES[0],
  );
  const [costType, setCostType] = useState<string>(
    values.cost_type ??
      defaultCostType(values.category ?? EXPENSE_CATEGORIES[0]),
  );

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

        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={errors.category ? true : undefined}>
            <FieldLabel htmlFor="expense-category">Կատեգորիա</FieldLabel>
            <select
              id="expense-category"
              name="category"
              required
              value={category}
              onChange={(event) => {
                const next = event.currentTarget.value;
                setCategory(next);
                setCostType(defaultCostType(next));
              }}
              className={SELECT_CLASS}
            >
              {EXPENSE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {EXPENSE_CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
            {errors.category && <FieldError>{errors.category}</FieldError>}
          </Field>
          <Field>
            <FieldLabel htmlFor="expense-status">Կարգավիճակ</FieldLabel>
            <select
              id="expense-status"
              name="status"
              defaultValue={values.status ?? "paid"}
              disabled={monthly}
              aria-describedby="expense-status-hint"
              className={SELECT_CLASS}
            >
              <option value="paid">Վճարված</option>
              <option value="unpaid">Չվճարված</option>
            </select>
          </Field>
        </div>
        <p
          id="expense-status-hint"
          className="-mt-2 text-xs text-muted-foreground"
        >
          Չվճարված ծախսը չի հաշվարկվում ընդհանուր ծախսերում և շահույթում, մինչև
          չնշեք վճարված։
        </p>

        <Field>
          <FieldLabel id="expense-cost-type-label">Ծախսի տեսակ</FieldLabel>
          <input type="hidden" name="cost_type" value={costType} />
          <div
            role="radiogroup"
            aria-labelledby="expense-cost-type-label"
            className="grid grid-cols-2 gap-2"
          >
            {COST_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                role="radio"
                aria-checked={costType === type}
                onClick={() => setCostType(type)}
                className={cn(
                  "rounded-2xl border px-3 py-2.5 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                  costType === type
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input hover:bg-muted",
                )}
              >
                <span className="block font-medium">
                  {COST_TYPE_LABELS[type]}
                </span>
                <span className="block text-xs opacity-75">
                  {type === "fixed"
                    ? "Վճարվում է՝ վաճառք լինի թե ոչ (գովազդ, վարձ)"
                    : "Աճում է ամեն վաճառքի հետ (նյութեր, փաթեթ)"}
                </span>
              </button>
            ))}
          </div>
        </Field>

        <Field data-invalid={errors.description ? true : undefined}>
          <FieldLabel htmlFor="expense-description">
            Նկարագրություն
            <span className="font-normal text-muted-foreground">
              (ոչ պարտադիր)
            </span>
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
            checked={monthly}
            onChange={(event) => setMonthly(event.currentTarget.checked)}
            className="mt-0.5 size-4 accent-[var(--primary)]"
          />
          <span>
            <span className="font-medium">Կրկնել ամեն ամիս</span>
            <span className="block text-muted-foreground">
              Օրինակ՝ վարձակալություն։ Կհաշվվի ամեն ամիս նույն օրը՝ սկսած
              ընտրված ամսաթվից։
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
          <Button
            variant="destructive"
            disabled={pending}
            onClick={confirmDelete}
          >
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
          <DialogTitle>
            {stopped ? "Ջնջե՞լ ամսական ծախսը" : "Դադարեցնե՞լ ամսական ծախսը"}
          </DialogTitle>
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
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() => run("delete")}
          >
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
