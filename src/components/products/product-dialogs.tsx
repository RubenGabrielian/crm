"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import { FieldError } from "@/components/ui/field";
import { PRODUCT_COPY } from "@/config/product-fields";
import { deleteProduct, deleteProducts } from "@/lib/products/actions";
import type { Product } from "@/lib/products/queries";
import { useTenant } from "@/lib/tenant/tenant-context";
import { ProductForm } from "./product-form";

export function AddProductDialog() {
  const { businessType } = useTenant();
  const [open, setOpen] = useState(false);
  const title = PRODUCT_COPY[businessType].add;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="lg" />}>
        <Plus />
        {title}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {/* Mounted only while open, so each opening starts with a clean form. */}
        <ProductForm onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

export function EditProductDialog({ product }: { product: Product }) {
  const { businessType } = useTenant();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="ghost" size="icon" aria-label={`Խմբագրել՝ ${product.title}`} />}
      >
        <Pencil />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{PRODUCT_COPY[businessType].edit}</DialogTitle>
        </DialogHeader>
        <ProductForm product={product} onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

export function DeleteProductDialog({ product }: { product: Product }) {
  const { businessType } = useTenant();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirmDelete() {
    startTransition(async () => {
      const result = await deleteProduct(product.id);
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
            aria-label={`Ջնջել՝ ${product.title}`}
          />
        }
      >
        <Trash2 />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="leading-snug">Ջնջե՞լ «{product.title}»</DialogTitle>
          <DialogDescription>
            {PRODUCT_COPY[businessType].deleteDescription}
          </DialogDescription>
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

/** Confirms deleting every selected product; `onDeleted` clears the selection. */
export function DeleteSelectedProductsDialog({
  productIds,
  everything,
  onDeleted,
}: {
  productIds: string[];
  /** Every listed product is selected, not just some. */
  everything: boolean;
  onDeleted: () => void;
}) {
  const { businessType } = useTenant();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const count = productIds.length;

  function confirmDelete() {
    startTransition(async () => {
      const result = await deleteProducts(productIds);
      if (result.ok) {
        setOpen(false);
        onDeleted();
      } else setError(result.error);
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
      <DialogTrigger render={<Button variant="destructive" size="sm" />}>
        <Trash2 />
        {everything ? `Ջնջել բոլորը (${count})` : `Ջնջել (${count})`}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="leading-snug">
            {everything
              ? `Ջնջե՞լ բոլոր ${count}-ը`
              : `Ջնջե՞լ ընտրված ${count} հատը`}
          </DialogTitle>
          <DialogDescription>
            {PRODUCT_COPY[businessType].deleteDescription}
          </DialogDescription>
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
