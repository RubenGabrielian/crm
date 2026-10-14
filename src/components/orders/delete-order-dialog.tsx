"use client";

import { useState, useTransition } from "react";
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
import { deleteOrder } from "@/lib/orders/actions";
import type { Order } from "@/lib/orders/queries";
import { useTenant } from "@/lib/tenant/tenant-context";

export function DeleteOrderDialog({ order }: { order: Order }) {
  const { businessType } = useTenant();
  const isShop = businessType === "ecommerce";
  const shortId = `#${order.id.slice(0, 8).toUpperCase()}`;

  const [open, setOpen] = useState(false);
  const [restock, setRestock] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const refreshNewOrders = useRefreshNewOrders();

  function confirmDelete() {
    startTransition(async () => {
      const result = await deleteOrder(order.id, isShop && restock);
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
        if (!next) {
          setError(null);
          setRestock(true);
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
            Հաճախորդը կմնա CRM-ում։
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
              <span className="font-medium">
                Վերադարձնել {order.qty} հատը պահեստ
              </span>
              <span className="block text-muted-foreground">
                Հանեք նշումը, եթե ապրանքն արդեն հանձնվել է հաճախորդին։
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
