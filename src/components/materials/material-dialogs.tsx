"use client";

import { useActionState, useState, useTransition } from "react";
import { PackagePlus, Pencil, Plus, Trash2 } from "lucide-react";
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
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatNumber } from "@/lib/format";
import {
  createMaterial,
  deleteMaterial,
  receiveMaterial,
  updateMaterial,
  type MaterialFormState,
} from "@/lib/materials/actions";
import type { Material } from "@/lib/materials/queries";

const INITIAL_STATE: MaterialFormState = {
  ok: false,
  values: {},
  errors: {},
  formError: null,
};

export function AddMaterialDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Plus />
        Ավելացնել նյութ
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Նոր նյութ</DialogTitle>
          <DialogDescription>
            Օրինակ՝ տոպրակ, պիտակ, տուփ։ Հետո ապրանքի մեջ նշեք, թե ամեն վաճառքից
            քանիսն է ծախսվում։
          </DialogDescription>
        </DialogHeader>
        <MaterialForm onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

export function EditMaterialDialog({ material }: { material: Material }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Խմբագրել՝ ${material.name}`}
          />
        }
      >
        <Pencil />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Խմբագրել նյութը</DialogTitle>
        </DialogHeader>
        <MaterialForm material={material} onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function MaterialForm({
  material,
  onSaved,
}: {
  material?: Material;
  onSaved: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    async (prev: MaterialFormState, formData: FormData) => {
      const next = material
        ? await updateMaterial(material.id, prev, formData)
        : await createMaterial(prev, formData);
      if (next.ok) onSaved();
      return next;
    },
    INITIAL_STATE,
  );
  const { values, errors } = state;
  // Live total, so the admin sees what "used" will become while typing.
  const [sales, setSales] = useState(
    values.used_in_sales ?? String(material?.usedInSales ?? 0),
  );
  const [gifts, setGifts] = useState(
    values.used_in_gifts ?? String(material?.usedInGifts ?? 0),
  );
  const totalUsed = (Number(sales) || 0) + (Number(gifts) || 0);

  return (
    <form action={formAction} noValidate className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
        <Field data-invalid={errors.name ? true : undefined}>
          <FieldLabel htmlFor="material-name">Անվանում</FieldLabel>
          <Input
            id="material-name"
            name="name"
            defaultValue={values.name ?? material?.name ?? ""}
            placeholder="Օրինակ՝ Մեծ տոպրակ"
            autoFocus
            autoComplete="off"
            aria-invalid={errors.name ? true : undefined}
          />
          {errors.name && <FieldError>{errors.name}</FieldError>}
        </Field>
        <Field data-invalid={errors.unit ? true : undefined}>
          <FieldLabel htmlFor="material-unit">Միավոր</FieldLabel>
          <Input
            id="material-unit"
            name="unit"
            defaultValue={values.unit ?? material?.unit ?? "հատ"}
            placeholder="հատ"
            autoComplete="off"
            aria-invalid={errors.unit ? true : undefined}
          />
          {errors.unit && <FieldError>{errors.unit}</FieldError>}
        </Field>
      </div>
      <Field data-invalid={errors.unit_cost ? true : undefined}>
        <FieldLabel htmlFor="material-unit-cost">
          Մեկ միավորի արժեք (֏)
        </FieldLabel>
        <Input
          id="material-unit-cost"
          name="unit_cost"
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          defaultValue={
            values.unit_cost ?? (material ? String(material.unitCost) : "")
          }
          placeholder="0"
          aria-invalid={errors.unit_cost ? true : undefined}
        />
        {!errors.unit_cost && (
          <FieldDescription>
            Օրինակ՝ 1 տոպրակը 300 ֏, կամ 1 գրամ սինտեպոնը 3,5 ֏։ Մտնում է
            ապրանքի փոփոխական ծախսի մեջ։
          </FieldDescription>
        )}
        {errors.unit_cost && <FieldError>{errors.unit_cost}</FieldError>}
      </Field>
      <Field data-invalid={errors.quantity ? true : undefined}>
        <FieldLabel htmlFor="material-quantity">
          {material ? "Առկա քանակ" : "Սկզբնական քանակ"}
        </FieldLabel>
        <Input
          id="material-quantity"
          name="quantity"
          type="number"
          inputMode="decimal"
          step="any"
          defaultValue={
            values.quantity ?? (material ? String(material.available) : "")
          }
          placeholder="0"
          aria-invalid={errors.quantity ? true : undefined}
        />
        {material && !errors.quantity && (
          <FieldDescription>
            Փոխեք միայն հաշվարկից հետո ուղղելու համար։ Նոր ստացվածը ավելացրեք
            «Մուտք» կոճակով։
          </FieldDescription>
        )}
        {errors.quantity && <FieldError>{errors.quantity}</FieldError>}
      </Field>
      {material && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={errors.used_in_sales ? true : undefined}>
              <FieldLabel htmlFor="material-used-sales">
                Վաճառքներից դուրս գրված
              </FieldLabel>
              <Input
                id="material-used-sales"
                name="used_in_sales"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={sales}
                onChange={(event) => setSales(event.currentTarget.value)}
                aria-invalid={errors.used_in_sales ? true : undefined}
              />
              {errors.used_in_sales && (
                <FieldError>{errors.used_in_sales}</FieldError>
              )}
            </Field>
            <Field data-invalid={errors.used_in_gifts ? true : undefined}>
              <FieldLabel htmlFor="material-used-gifts">
                Նվերներից դուրս գրված
              </FieldLabel>
              <Input
                id="material-used-gifts"
                name="used_in_gifts"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={gifts}
                onChange={(event) => setGifts(event.currentTarget.value)}
                aria-invalid={errors.used_in_gifts ? true : undefined}
              />
              {errors.used_in_gifts && (
                <FieldError>{errors.used_in_gifts}</FieldError>
              )}
            </Field>
          </div>
          <p
            aria-live="polite"
            className="flex items-baseline justify-between rounded-2xl bg-muted px-4 py-3 text-sm tabular-nums"
          >
            <span className="text-muted-foreground">Ընդհանուր օգտագործված</span>
            <span className="font-semibold">
              {formatNumber(Math.round(totalUsed * 100) / 100)} {material.unit}
            </span>
          </p>
        </>
      )}

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

export function ReceiveMaterialDialog({ material }: { material: Material }) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await receiveMaterial(material.id, Number(quantity));
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
            aria-label={`Մուտք՝ ${material.name}`}
          />
        }
      >
        <PackagePlus />
        Մուտք
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Ավելացնել պահեստ</DialogTitle>
          <DialogDescription>
            {material.name}։ Առկա է՝ {formatNumber(material.available)}{" "}
            {material.unit}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="grid gap-4">
          <Field data-invalid={error ? true : undefined}>
            <FieldLabel htmlFor="material-receive">
              Ստացված քանակ ({material.unit})
            </FieldLabel>
            <Input
              id="material-receive"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={quantity}
              onChange={(event) => setQuantity(event.currentTarget.value)}
              autoFocus
              aria-invalid={error ? true : undefined}
            />
            {error && <FieldError>{error}</FieldError>}
          </Field>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Չեղարկել
            </DialogClose>
            <Button type="submit" disabled={pending || !quantity}>
              {pending ? "Պահպանվում է…" : "Ավելացնել"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteMaterialDialog({ material }: { material: Material }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirmDelete() {
    startTransition(async () => {
      const result = await deleteMaterial(material.id);
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
            aria-label={`Ջնջել՝ ${material.name}`}
          />
        }
      >
        <Trash2 />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ջնջե՞լ «{material.name}»</DialogTitle>
          <DialogDescription>
            Նյութը կհեռացվի պահեստից և բոլոր ապրանքներից, որոնք այն օգտագործում
            են։
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
            onClick={confirmDelete}
          >
            {pending ? "Ջնջվում է…" : "Ջնջել"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
