"use client";

import { useActionState, useState } from "react";
import { Pencil } from "lucide-react";
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
import { updateCustomer, type CustomerFormState } from "@/lib/customers/actions";
import type { CustomerProfile } from "@/lib/customers/queries";

const INITIAL_STATE: CustomerFormState = {
  ok: false,
  values: {},
  errors: {},
  formError: null,
};

export function EditCustomerDialog({ customer }: { customer: CustomerProfile }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Pencil />
        Խմբագրել
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Խմբագրել հաճախորդին</DialogTitle>
        </DialogHeader>
        {/* Mounted only while open, so each opening starts from the saved data. */}
        <EditCustomerForm customer={customer} onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function EditCustomerForm({
  customer,
  onSaved,
}: {
  customer: CustomerProfile;
  onSaved: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    async (prev: CustomerFormState, formData: FormData) => {
      const next = await updateCustomer(customer.id, prev, formData);
      if (next.ok) onSaved();
      return next;
    },
    INITIAL_STATE,
  );

  const fields = [
    { name: "name", label: "Անուն Ազգանուն", type: "text", initial: customer.name, required: true },
    { name: "phone", label: "Հեռախոս", type: "tel", initial: customer.phone ?? "", required: true },
    { name: "email", label: "Էլ. հասցե", type: "email", initial: customer.email ?? "", required: false },
    {
      name: "instagram",
      label: "Instagram",
      type: "text",
      initial: customer.socialHandle ? `@${customer.socialHandle}` : "",
      required: false,
      placeholder: "@anun",
    },
  ];

  return (
    <form action={formAction} noValidate className="grid gap-4">
      <FieldGroup className="gap-4">
        {fields.map((field, index) => {
          const id = `customer-${field.name}`;
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
                defaultValue={state.values[field.name] ?? field.initial}
                required={field.required}
                autoFocus={index === 0}
                autoComplete="off"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${id}-error` : undefined}
              />
              {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
            </Field>
          );
        })}
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
