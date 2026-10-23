"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { cn } from "cn";
import {
  DeleteOrderDialog,
  DeleteSelectedOrdersDialog,
} from "@/components/orders/delete-order-dialog";
import { EditOrderDialog } from "@/components/orders/edit-order-dialog";
import { OrderCommentDialog } from "@/components/orders/order-comment-dialog";
import { OrderPaymentSelect } from "@/components/orders/order-payment-select";
import { OrderSourceSelect } from "@/components/orders/order-source-select";
import { OrderStatusSelect } from "@/components/orders/order-status-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Checkbox,
  SELECTABLE_ROW,
  SelectionBar,
} from "@/components/ui/selection";
import { formatDateTime, formatMoney, formatNumber } from "@/lib/format";
import { selectAllOrderIds } from "@/lib/orders/actions";
import type { Order } from "@/lib/orders/queries";

/** The orders table with inline status, source, payment and row actions. */
export function OrdersTable({
  orders,
  isShop,
  itemLabel,
  sourceNames,
  total = orders.length,
  selectAllParams,
}: {
  orders: Order[];
  isShop: boolean;
  /** Column title for what was ordered, e.g. "Ապրանք". */
  itemLabel: string;
  sourceNames: string[];
  /** Orders on all pages; defaults to the ones shown. */
  total?: number;
  /**
   * The list's search and filters, for selecting the orders on other pages
   * too. Without it "select all" picks only the orders shown.
   */
  selectAllParams?: Record<string, string | undefined>;
}) {
  const numeric = "px-2 text-right tabular-nums";

  // Kept across pages. The page remounts this table when the search or
  // filters change, which starts a fresh selection.
  const [picked, setPicked] = useState<Set<string>>(() => new Set());
  const [selectError, setSelectError] = useState<string | null>(null);
  const [selectingAll, startSelectingAll] = useTransition();
  const pageIds = orders.map((order) => order.id);
  const pageSelected = pageIds.filter((id) => picked.has(id)).length;
  const allOnPage = pageIds.length > 0 && pageSelected === pageIds.length;

  function toggle(ids: string[], on: boolean) {
    setPicked((current) => {
      const next = new Set(current);
      for (const id of ids) {
        if (on) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  function selectAll() {
    setSelectError(null);
    if (!selectAllParams) return toggle(pageIds, true);
    startSelectingAll(async () => {
      const result = await selectAllOrderIds(selectAllParams);
      if (result.error) setSelectError(result.error);
      else setPicked(new Set(result.ids));
    });
  }

  return (
      <div
        className="overflow-hidden rounded-3xl bg-card p-3 shadow-soft"
      >
        {picked.size > 0 && (
          <SelectionBar
            selected={picked.size}
            total={Math.max(total, picked.size)}
            wholePage={allOnPage && picked.size === pageIds.length}
            onSelectAll={selectAll}
            selectingAll={selectingAll}
            onClear={() => {
              setPicked(new Set());
              setSelectError(null);
            }}
          >
            <DeleteSelectedOrdersDialog
              orderIds={[...picked]}
              everything={picked.size >= total}
              onDeleted={() => setPicked(new Set())}
            />
          </SelectionBar>
        )}
        {selectError && (
          <p role="alert" className="mb-3 px-4 text-sm text-destructive">
            {selectError}
          </p>
        )}
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 pl-4">
                <Checkbox
                  label="Ընտրել էջի բոլորը"
                  checked={allOnPage}
                  indeterminate={pageSelected > 0 && !allOnPage}
                  onChange={(on) => toggle(pageIds, on)}
                />
              </TableHead>
              <TableHead className="px-2">Ամսաթիվ</TableHead>
              <TableHead className="px-2">Հաճախորդ</TableHead>
              <TableHead className="px-2">
                {itemLabel}
              </TableHead>
              <TableHead className={numeric}>Քանակ</TableHead>
              <TableHead className={numeric}>Միավորի գին</TableHead>
              <TableHead className={numeric}>Զեղչ</TableHead>
              {isShop && <TableHead className={numeric}>Առաքում</TableHead>}
              <TableHead className={numeric}>Ընդամենը</TableHead>
              <TableHead className="px-2">Կարգավիճակ</TableHead>
              <TableHead className="px-2">Վճարում</TableHead>
              <TableHead className="px-2 pr-4">
                <span className="sr-only">Գործողություններ</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow
                key={order.id}
                data-state={picked.has(order.id) ? "selected" : undefined}
                className={SELECTABLE_ROW}
              >
                <TableCell className="w-10 pl-4">
                  <Checkbox
                    label={`Ընտրել #${order.id.slice(0, 8).toUpperCase()}`}
                    checked={picked.has(order.id)}
                    onChange={(on) => toggle([order.id], on)}
                  />
                </TableCell>
                <TableCell className="px-2 tabular-nums" title={order.id}>
                  <span className="block">
                    {formatDateTime(order.createdAt)}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </span>
                </TableCell>
                <TableCell className="max-w-44 px-2 whitespace-normal">
                  <Link
                    href={`/customers/${order.customerId}`}
                    className="block font-medium underline-offset-2 outline-none hover:underline focus-visible:underline"
                  >
                    {order.customerName}
                  </Link>
                  {order.customerPhone && (
                    <a
                      href={`tel:${order.customerPhone}`}
                      className="block text-xs tabular-nums text-muted-foreground hover:underline"
                    >
                      {order.customerPhone}
                    </a>
                  )}
                  {isShop && order.address && (
                    <span className="block text-xs text-muted-foreground">
                      {order.address}
                    </span>
                  )}
                </TableCell>
                <TableCell className="max-w-44 px-2 whitespace-normal">
                  {order.productTitle}
                  {order.scheduledAt && (
                    <span className="mt-1 flex items-center gap-1 text-xs font-medium tabular-nums text-[#185aef]">
                      <CalendarClock className="size-3.5 shrink-0" aria-hidden />
                      <span className="sr-only">Օր և ժամ՝ </span>
                      {formatDateTime(order.scheduledAt)}
                    </span>
                  )}
                  {order.comment && (
                    <span
                      title={order.comment}
                      className="mt-1 line-clamp-2 rounded-lg bg-apricot/35 px-2 py-1 text-xs whitespace-pre-line text-foreground/80"
                    >
                      {order.comment}
                    </span>
                  )}
                </TableCell>
                <TableCell className={numeric}>
                  {formatNumber(order.qty)}
                </TableCell>
                <TableCell className={numeric}>
                  {formatMoney(order.unitPrice)}
                </TableCell>
                <TableCell className={numeric}>
                  {order.discountAmount > 0 ? (
                    <>
                      −{formatMoney(order.discountAmount)}
                      {order.discountPercent > 0 && (
                        <span className="block text-xs text-muted-foreground">
                          {formatNumber(order.discountPercent)}%
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                {isShop && (
                  <TableCell className={numeric}>
                    {formatMoney(order.deliveryFee)}
                  </TableCell>
                )}
                <TableCell className={cn(numeric, "font-semibold")}>
                  {formatMoney(order.orderTotal)}
                </TableCell>
                <TableCell className="px-2">
                  <span className="flex flex-col items-start gap-1.5 py-1">
                    <OrderStatusSelect
                      orderId={order.id}
                      status={order.status}
                      label={`#${order.id.slice(0, 8).toUpperCase()}`}
                    />
                    <OrderSourceSelect
                      orderId={order.id}
                      source={order.source}
                      options={sourceNames}
                      label={`#${order.id.slice(0, 8).toUpperCase()}`}
                    />
                  </span>
                </TableCell>
                <TableCell className="px-2">
                  <OrderPaymentSelect
                    orderId={order.id}
                    paid={order.paid}
                    method={order.paymentMethod}
                    label={`#${order.id.slice(0, 8).toUpperCase()}`}
                  />
                </TableCell>
                <TableCell className="px-2 pr-4 text-right">
                  <span className="flex flex-col items-end">
                    <OrderCommentDialog
                      orderId={order.id}
                      label={`#${order.id.slice(0, 8).toUpperCase()}, ${order.customerName}`}
                      comment={order.comment}
                    />
                    <EditOrderDialog order={order} />
                    <DeleteOrderDialog order={order} />
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
  );
}
