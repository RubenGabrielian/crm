"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ImageOff, Trash2, Upload } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  BASE_PRODUCT_FIELDS,
  ITEM_KIND_LABELS,
  productFields,
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
import { itemKind, type ItemKind } from "@/lib/tenant/features";
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
  // A mixed business picks the kind of a new item; an existing one keeps it.
  const [kind, setKind] = useState<ItemKind>(
    product
      ? itemKind(businessType, product.stock)
      : itemKind(businessType, 0),
  );
  const choosesKind = businessType === "mixed" && !product;
  const fields = [...BASE_PRODUCT_FIELDS, ...productFields(businessType, kind)];

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
        {choosesKind && (
          <KindPicker value={kind} onChange={setKind} />
        )}
        {fields.map((field, index) => (
          <ProductFieldInput
            key={`${kind}-${field.name}`}
            field={field}
            defaultValue={
              state.values[field.name] ?? initialValue(field, product)
            }
            error={state.errors[field.name]}
            autoFocus={index === 0 && !choosesKind}
          />
        ))}

        {/* Materials: packaging for goods, consumables (glue, …) for services. */}
        {businessType !== "service" && (
          <MaterialUsesField
            initial={product?.materials ?? []}
            error={state.errors.materials}
          />
        )}

        <ProductImageField
          currentUrl={product?.imageUrl ?? null}
          error={shownImageError}
          onPick={checkImage}
        />
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

/** Good or service; only shown when a mixed business adds a new item. */
function KindPicker({
  value,
  onChange,
}: {
  value: ItemKind;
  onChange: (kind: ItemKind) => void;
}) {
  const hints: Record<ItemKind, string> = {
    product: "Ունի պահեստային մնացորդ",
    service: "Առանց պահեստի, օր.՝ տեղադրում",
  };
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-2 text-sm font-medium">Ի՞նչ եք ավելացնում</legend>
      <input type="hidden" name="kind" value={value} />
      <div className="grid grid-cols-2 gap-2">
        {(["product", "service"] as const).map((option) => (
          <label
            key={option}
            className={cn(
              "flex cursor-pointer flex-col gap-0.5 rounded-2xl border px-3.5 py-2.5 text-sm transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
              value === option
                ? "border-primary bg-primary/5"
                : "border-input hover:bg-muted",
            )}
          >
            <input
              type="radio"
              name="kind-choice"
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              className="sr-only"
            />
            <span className="font-medium">{ITEM_KIND_LABELS[option]}</span>
            <span className="text-xs text-muted-foreground">
              {hints[option]}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
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

/**
 * Picture of the product: shows the current one (or the newly picked file),
 * lets the admin pick another and remove it. A removed picture is sent as
 * remove_image; an empty file input keeps the current one.
 */
function ProductImageField({
  currentUrl,
  error,
  onPick,
}: {
  currentUrl: string | null;
  error: string | undefined | null;
  /** Validates the picked file; clears the input when it is not allowed. */
  onPick: (input: HTMLInputElement) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);

  // Free the preview's object URL when it is replaced or the form closes.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const shown = preview ?? (removed ? null : currentUrl);

  function pick(input: HTMLInputElement) {
    onPick(input);
    const file = input.files?.[0];
    setPreview(file ? URL.createObjectURL(file) : null);
    if (file) setRemoved(false);
  }

  function remove() {
    if (inputRef.current) inputRef.current.value = "";
    setPreview(null);
    setRemoved(true);
  }

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor="product-image">
        Նկար
        <span className="font-normal text-muted-foreground">(ոչ պարտադիր)</span>
      </FieldLabel>
      <div className="flex items-center gap-3">
        <span className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted text-muted-foreground">
          {shown ? (
            <Image src={shown} alt="" fill sizes="80px" unoptimized={shown === preview} className="object-cover" />
          ) : (
            <ImageOff className="size-5" aria-hidden />
          )}
        </span>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            <Upload />
            {shown ? "Փոխել նկարը" : "Ընտրել նկար"}
          </Button>
          {shown && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={remove}
            >
              <Trash2 />
              Հեռացնել
            </Button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        id="product-image"
        name="image"
        type="file"
        accept={Object.keys(PRODUCT_IMAGE_TYPES).join(",")}
        onChange={(event) => pick(event.currentTarget)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "product-image-error" : undefined}
        className="sr-only"
      />
      {removed && <input type="hidden" name="remove_image" value="1" />}
      {error && <FieldError id="product-image-error">{error}</FieldError>}
    </Field>
  );
}
