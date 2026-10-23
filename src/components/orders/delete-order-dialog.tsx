"use client";

import { useState, useTransition } from "react";
import { cn } from "cn";
import { Trash2 } from "lucide-react";
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
import { useRefreshNewOrders } from "@/components/layout/new-orders";
import {
  deleteOrder,
  deleteOrders,
  getOrderDeleteInfo,
} from "@/lib/orders/actions";
import type { Order } from "@/lib/orders/queries";
import { useTenant } from "@/lib/tenant/tenant-context";

export function DeleteOrderDialog({ order }: { order: Order }) {
  const { businessType } = useTenant();
  const isShop = businessType !== "service";
  const shortId = `#${order.id.slice(0, 8).toUpperCase()}`;

  const [open, setOpen] = useState(false);
  const [restock, setRestock] = useState(true);
  const [deleteCustomer, setDeleteCustomer] = useState(false);
  // Loaded when the dialog opens; null while loading or if unknown.
  const [info, setInfo] = useState<{
    otherOrders: number;
    tracksStock: boolean;
  } | null>(null);
  const otherOrders = info?.otherOrders ?? null;
  // Until known, assume goods so the stock option is not lost by mistake.
  const offersRestock = isShop && (info?.tracksStock ?? true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const refreshNewOrders = useRefreshNewOrders();

  function confirmDelete() {
    startTransition(async () => {
      const result = await deleteOrder(
        order.id,
        offersRestock && restock,
        deleteCustomer && otherOrders === 0,
      );
      refreshNewOrders();
      if (result.ok) setOpen(false);
      else setError(result.error);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setInfo(null);
          getOrderDeleteInfo(order.id).then(setInfo);
        } else {
          setError(null);
          setRestock(true);
          setDeleteCustomer(false);
        }
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive"
            aria-label={`Ջնջել ${isShop ? "պատվերը" : "գրանցումը"} ${shortId}`}
          />
        }
      >
        <Trash2 />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isShop ? "Ջնջե՞լ պատվերը" : "Ջնջե՞լ գրանցումը"} {shortId}
          </DialogTitle>
          <DialogDescription>
            {order.customerName}, {order.productTitle} × {order.qty}։ Այն
            կհեռացվի ցանկից և հաշվարկներից, և հնարավոր չի լինի վերականգնել։
          </DialogDescription>
        </DialogHeader>

        {offersRestock && (
          <label className="flex cursor-pointer items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={restock}
              onChange={(event) => setRestock(event.currentTarget.checked)}
              className="mt-0.5 size-4 accent-[var(--primary)]"
            />
            <span>
              <span className="font-medium">
                Վերադարձնել {order.qty} հատը պահեստ
              </span>
              <span className="block text-muted-foreground">
                Հանեք նշումը, եթե ապրանքն արդեն հանձնվել է հաճախորդին։
              </span>
            </span>
          </label>
        )}

        {/* What happens to the customer */}
        <fieldset className="grid gap-2">
          <legend className="mb-2 text-sm font-medium">
            Ի՞նչ անել {order.customerName}-ի հետ
          </legend>
          <CustomerChoice
            checked={!deleteCustomer}
            onSelect={() => setDeleteCustomer(false)}
            title="Պահել CRM-ում"
            text="Անունը, հեռախոսը և նախորդ գնումները կմնան։"
          />
          <CustomerChoice
            checked={deleteCustomer}
            onSelect={() => setDeleteCustomer(true)}
            disabled={otherOrders !== 0}
            title="Ջնջել նաև հաճախորդին"
            text={
              otherOrders === null
                ? "Ստուգվում է…"
                : otherOrders > 0
                  ? `Հնարավոր չէ. ունի ևս ${otherOrders} ${isShop ? "պատվեր" : "գրանցում"}, որոնք կկորչեին։`
                  : "Նրա տվյալները կհեռացվեն CRM-ից։"
            }
          />
        </fieldset>

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

/** Confirms deleting every selected order; `onDeleted` clears the selection. */
export function DeleteSelectedOrdersDialog({
  orderIds,
  everything,
  onDeleted,
}: {
  orderIds: string[];
  /** Every listed order is selected, not just some. */
  everything: boolean;
  onDeleted: () => void;
}) {
  const { businessType } = useTenant();
  const isShop = businessType !== "service";
  const count = orderIds.length;
  const word = isShop ? "պատվեր" : "գրանցում";

  const [open, setOpen] = useState(false);
  // Off by default: most old orders were handed over, their stock is gone.
  const [restock, setRestock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const refreshNewOrders = useRefreshNewOrders();

  function confirmDelete() {
    startTransition(async () => {
      const result = await deleteOrders(orderIds, isShop && restock);
      refreshNewOrders();
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
        if (!next) {
          setError(null);
          setRestock(false);
        }
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
              ? `Ջնջե՞լ բոլոր ${count} ${word}ը`
              : `Ջնջե՞լ ընտրված ${count} ${word}ը`}
          </DialogTitle>
          <DialogDescription>
            Դրանք կհեռացվեն ցանկից և հաշվարկներից, և հնարավոր չի լինի
            վերականգնել։ Հաճախորդները կմնան CRM-ում։
          </DialogDescription>
        </DialogHeader>

        {isShop && (
          <label className="flex cursor-pointer items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={restock}
              onChange={(event) => setRestock(event.currentTarget.checked)}
              className="mt-0.5 size-4 accent-[var(--primary)]"
            />
            <span>
              <span className="font-medium">Վերադարձնել քանակները պահեստ</span>
              <span className="block text-muted-foreground">
                Նշեք միայն եթե ապրանքները դեռ չեն հանձնվել հաճախորդներին։
              </span>
            </span>
          </label>
        )}

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

function CustomerChoice({
  checked,
  onSelect,
  disabled,
  title,
  text,
}: {
  checked: boolean;
  onSelect: () => void;
  disabled?: boolean;
  title: string;
  text: string;
}) {
  return (
    <label
      className={cn(
        "flex items-start gap-2.5 rounded-2xl border px-3.5 py-2.5 text-sm transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring",
        disabled
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer hover:bg-muted",
        checked && !disabled ? "border-primary" : "border-input",
      )}
    >
      <input
        type="radio"
        name="customer-choice"
        checked={checked && !disabled}
        disabled={disabled}
        onChange={onSelect}
        className="mt-0.5 size-4 accent-[var(--primary)]"
      />
      <span>
        <span className="block font-medium">{title}</span>
        <span className="block text-muted-foreground">{text}</span>
      </span>
    </label>
  );
}
