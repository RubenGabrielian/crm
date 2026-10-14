"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  BASE_PRODUCT_FIELDS,
  PRODUCT_FIELDS,
  type ProductField,
} from "@/config/product-fields";
import {
  PRODUCT_IMAGE_ERRORS,
  PRODUCT_IMAGE_MAX_BYTES,
  PRODUCT_IMAGE_TYPES,
} from "@/config/product-images";
import {
  createProduct,
  updateProduct,
  type ProductFormState,
} from "@/lib/products/actions";
import type { Product } from "@/lib/products/queries";
import { useTenant } from "@/lib/tenant/tenant-context";
import { MaterialUsesField } from "@/components/materials/material-uses-field";

const INITIAL_STATE: ProductFormState = {
  ok: false,
  values: {},
  errors: {},
  formError: null,
};

function initialValue(
  field: ProductField,
  product: Product | undefined,
): string {
  if (!product) return "";
  if (field.name === "title") return product.title;
  if (field.name === "price") return String(product.price);
  const value =
    field.target === "stock" ? product.stock : product.metadata[field.name];
  return value === null || value === undefined ? "" : String(value);
}

/** Add form when `product` is omitted, edit form when it is given. */
export function ProductForm({
  product,
  onSaved,
}: {
  product?: Product;
  onSaved: () => void;
}) {
  const { businessType } = useTenant();
  const fields = [...BASE_PRODUCT_FIELDS, ...PRODUCT_FIELDS[businessType]];

  const [state, formAction, pending] = useActionState(
    async (prev: ProductFormState, formData: FormData) => {
      const next = product
        ? await updateProduct(product.id, prev, formData)
        : await createProduct(prev, formData);
      if (next.ok) onSaved();
      return next;
    },
    INITIAL_STATE,
  );

  // Checked in the browser too, so an oversized file is caught before upload.
  const [imageError, setImageError] = useState<string | null>(null);
  function checkImage(input: HTMLInputElement) {
    const file = input.files?.[0];
    let error: string | null = null;
    if (file && !(file.type in PRODUCT_IMAGE_TYPES))
      error = PRODUCT_IMAGE_ERRORS.type;
    else if (file && file.size > PRODUCT_IMAGE_MAX_BYTES)
      error = PRODUCT_IMAGE_ERRORS.size;
    if (error) input.value = "";
    setImageError(error);
  }
  const shownImageError = imageError ?? state.errors.image;

  return (
    <form action={formAction} noValidate className="grid gap-4">
      <FieldGroup className="gap-4">
        {fields.map((field, index) => (
          <ProductFieldInput
            key={field.name}
            field={field}
            defaultValue={
              state.values[field.name] ?? initialValue(field, product)
            }
            error={state.errors[field.name]}
            autoFocus={index === 0}
          />
        ))}

        {businessType === "ecommerce" && (
          <MaterialUsesField
            initial={product?.materials ?? []}
            error={state.errors.materials}
          />
        )}

        <Field data-invalid={shownImageError ? true : undefined}>
          <FieldLabel htmlFor="product-image">
            Նկար
            <span className="font-normal text-muted-foreground">
              (ոչ պարտադիր)
            </span>
          </FieldLabel>
          <Input
            id="product-image"
            name="image"
            type="file"
            accept={Object.keys(PRODUCT_IMAGE_TYPES).join(",")}
            onChange={(event) => checkImage(event.currentTarget)}
            aria-invalid={shownImageError ? true : undefined}
            aria-describedby={
              shownImageError ? "product-image-error" : undefined
            }
          />
          {product?.imageUrl && !shownImageError && (
            <FieldDescription>
              Թողեք դատարկ՝ ներկայիս նկարը պահելու համար։
            </FieldDescription>
          )}
          {shownImageError && (
            <FieldError id="product-image-error">{shownImageError}</FieldError>
          )}
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

function ProductFieldInput({
  field,
  defaultValue,
  error,
  autoFocus,
}: {
  field: ProductField;
  defaultValue: string;
  error?: string;
  autoFocus?: boolean;
}) {
  const id = `product-${field.name}`;
  const errorId = `${id}-error`;
  const numeric = field.kind !== "text";

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>
        {field.label}
        {!field.required && (
          <span className="font-normal text-muted-foreground">
            (ոչ պարտադիր)
          </span>
        )}
      </FieldLabel>
      <Input
        id={id}
        name={field.name}
        type={numeric ? "number" : "text"}
        inputMode={
          field.kind === "money"
            ? "decimal"
            : field.kind === "integer"
              ? "numeric"
              : undefined
        }
        min={numeric ? field.min : undefined}
        step={
          field.kind === "integer"
            ? 1
            : field.kind === "money"
              ? "any"
              : undefined
        }
        defaultValue={defaultValue}
        required={field.required}
        autoFocus={autoFocus}
        autoComplete="off"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </Field>
  );
}
