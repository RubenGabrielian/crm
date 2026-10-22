"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";
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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createCustomer, type CustomerFormState } from "@/lib/customers/actions";
import { useNavLabels } from "@/lib/navigation/labels-context";

const INITIAL_STATE: CustomerFormState = {
  ok: false,
  values: {},
  errors: {},
  formError: null,
};

/** CRM: add a new customer, or an earlier one who isn't in Numa yet. */
export function AddCustomerDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="h-11 rounded-2xl" />}>
        <UserPlus />
        Ավելացնել հաճախորդ
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Նոր հաճախորդ</DialogTitle>
        </DialogHeader>
        {/* Mounted only while open, so each opening starts empty. */}
        <AddCustomerForm onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function AddCustomerForm({ onSaved }: { onSaved: () => void }) {
  const { commentLabel } = useNavLabels();
  const [state, formAction, pending] = useActionState(
    async (prev: CustomerFormState, formData: FormData) => {
      const next = await createCustomer(prev, formData);
      if (next.ok) onSaved();
      return next;
    },
    INITIAL_STATE,
  );

  const fields = [
    { name: "name", label: "Անուն Ազգանուն", type: "text", required: true },
    { name: "phone", label: "Հեռախոս", type: "tel", required: true, placeholder: "091 123 456" },
    { name: "email", label: "Էլ. հասցե", type: "email", required: false },
    { name: "instagram", label: "Instagram", type: "text", required: false, placeholder: "@anun" },
  ];
  const commentError = state.errors.comment;

  return (
    <form action={formAction} noValidate className="grid gap-4">
      <FieldGroup className="gap-4">
        {fields.map((field, index) => {
          const id = `new-customer-${field.name}`;
          const error = state.errors[field.name];
          return (
            <Field key={field.name} data-invalid={error ? true : undefined}>
              <FieldLabel htmlFor={id}>
                {field.label}
                {!field.required && (
                  <span className="font-normal text-muted-foreground">(ոչ պարտադիր)</span>
                )}
              </FieldLabel>
              <Input
                id={id}
                name={field.name}
                type={field.type}
                placeholder={field.placeholder}
                defaultValue={state.values[field.name] ?? ""}
                required={field.required}
                autoFocus={index === 0}
                autoComplete="off"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${id}-error` : undefined}
              />
              {error && (
                <FieldError id={`${id}-error`}>
                  {error}
                  {field.name === "phone" && state.existingId && (
                    <>
                      {" "}
                      <Link
                        href={`/customers/${state.existingId}`}
                        className="font-medium underline underline-offset-2"
                      >
                        Բացել նրա էջը
                      </Link>
                    </>
                  )}
                </FieldError>
              )}
            </Field>
          );
        })}
        <Field data-invalid={commentError ? true : undefined}>
          <FieldLabel htmlFor="new-customer-comment">
            {commentLabel}
            <span className="font-normal text-muted-foreground">(ոչ պարտադիր)</span>
          </FieldLabel>
          <textarea
            id="new-customer-comment"
            name="comment"
            rows={3}
            maxLength={2000}
            defaultValue={state.values.comment ?? ""}
            placeholder="Օրինակ՝ նախկին հաճախորդ, գնել է 2 անգամ"
            aria-invalid={commentError ? true : undefined}
            className="w-full resize-y rounded-xl border border-input bg-card px-3 py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
          />
          {commentError && <FieldError>{commentError}</FieldError>}
        </Field>
      </FieldGroup>

      {state.formError && <FieldError>{state.formError}</FieldError>}

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          Չեղարկել
        </DialogClose>
        <Button type="submit" disabled={pending}>
          {pending ? "Պահպանվում է…" : "Ավելացնել"}
        </Button>
      </DialogFooter>
    </form>
  );
}
