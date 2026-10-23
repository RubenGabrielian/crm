"use client";

import { useState } from "react";
import { cn } from "cn";
import { Check, ListChecks, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TruncatedText } from "@/components/ui/truncated-text";
import {
  ITEM_KIND_LABELS,
  productColumns,
  type ProductField,
} from "@/config/product-fields";
import { formatMoney, formatNumber } from "@/lib/format";
import type { Product } from "@/lib/products/queries";
import { itemKind, type BusinessType } from "@/lib/tenant/features";
import { COST_FIELDS } from "@/lib/tenant/permissions";
import { useCan } from "@/lib/tenant/tenant-context";
import { DeleteSelectedProductsDialog } from "./product-dialogs";
import { ProductRowActions } from "./product-row-actions";
import { ProductThumb } from "./product-thumb";

// Tighter cells until there is room, so every column fits without scrolling.
const CELL_X = "px-2 xl:px-4";

// A <tr> can't be rounded, so hover and selection paint the cells and round
// the outer ones, matching the pill-shaped header.
const ROW_CLASS = cn(
  "hover:bg-transparent data-[state=selected]:bg-transparent data-[state=selected]:border-card",
  "[&>td]:transition-colors [&>td:first-child]:rounded-l-2xl [&>td:last-child]:rounded-r-2xl",
  "hover:[&>td]:bg-muted/40 data-[state=selected]:[&>td]:bg-primary/4 data-[state=selected]:hover:[&>td]:bg-primary/8",
);

function formatCell(field: ProductField, product: Product) {
  const value =
    field.target === "stock" ? product.stock : product.metadata[field.name];
  if (value === null || value === undefined || value === "") return "—";
  if (field.kind === "money") return formatMoney(Number(value));
  if (field.kind === "integer") return formatNumber(Number(value));
  return String(value);
}

function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <span className="relative inline-flex size-[18px] shrink-0 align-middle">
      <input
        type="checkbox"
        role="checkbox"
        aria-label={label}
        checked={checked}
        ref={(el) => {
          if (el) el.indeterminate = indeterminate;
        }}
        onChange={(event) => onChange(event.currentTarget.checked)}
        className="peer size-full cursor-pointer appearance-none rounded-md border-[1.5px] border-muted-foreground/40 bg-card transition-colors outline-none hover:border-primary checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      <Check
        aria-hidden
        strokeWidth={3}
        className="pointer-events-none absolute inset-0 m-auto hidden size-3 text-primary-foreground peer-checked:block"
      />
      <Minus
        aria-hidden
        strokeWidth={3}
        className="pointer-events-none absolute inset-0 m-auto hidden size-3 text-primary-foreground peer-indeterminate:block"
      />
    </span>
  );
}

export function ProductsTable({
  products,
  allIds,
  businessType,
  showCost,
}: {
  products: Product[];
  /** Every product the current search found, on all pages. */
  allIds: string[];
  businessType: BusinessType;
  /** False for employees who may not see cost prices: the column is left out. */
  showCost: boolean;
}) {
  const fields = productColumns(businessType).filter(
    (field) => showCost || !COST_FIELDS.includes(field.name),
  );
  const showsKind = businessType === "mixed";
  const canSelect = useCan("catalog_edit");

  // Kept across pages; ids that are no longer listed (deleted, filtered out)
  // simply stop counting.
  const [picked, setPicked] = useState<Set<string>>(() => new Set());
  const listed = new Set(allIds);
  const selected = [...picked].filter((id) => listed.has(id));
  const pageIds = products.map((product) => product.id);
  const pageSelected = pageIds.filter((id) => picked.has(id)).length;
  const allOnPage = pageIds.length > 0 && pageSelected === pageIds.length;
  const everything = allIds.length > 0 && selected.length === allIds.length;

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

  return (
    <div className="overflow-hidden rounded-3xl bg-card p-3 shadow-soft">
      {selected.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-primary/8 py-2 pr-2 pl-4 text-sm">
          <span className="font-medium">
            {everything
              ? `Ընտրված են բոլոր ${formatNumber(allIds.length)}-ը`
              : allOnPage && selected.length === pageIds.length
                ? `Ընտրված են այս էջի բոլոր ${formatNumber(selected.length)}-ը`
                : `Ընտրված է՝ ${formatNumber(selected.length)}`}
          </span>
          {/* The page checkbox only covers this page; this reaches the rest. */}
          {!everything && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggle(allIds, true)}
            >
              <ListChecks />
              Ընտրել բոլոր {formatNumber(allIds.length)}-ը
            </Button>
          )}
          <button
            type="button"
            onClick={() => setPicked(new Set())}
            className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Հանել ընտրությունը
          </button>
          <span className="ml-auto">
            <DeleteSelectedProductsDialog
              productIds={selected}
              everything={everything}
              onDeleted={() => setPicked(new Set())}
            />
          </span>
        </div>
      )}
      {/* Phones and tablets: one card per item, every value visible. */}
      <div className="lg:hidden">
        {canSelect && (
          <label className="flex cursor-pointer items-center gap-3 px-2 pb-2 text-sm text-muted-foreground">
            <Checkbox
              label="Ընտրել էջի բոլորը"
              checked={allOnPage}
              indeterminate={pageSelected > 0 && !allOnPage}
              onChange={(on) => toggle(pageIds, on)}
            />
            Ընտրել էջի բոլորը
          </label>
        )}
        <ul className="divide-y divide-border/70">
          {products.map((product) => (
            <li
              key={product.id}
              className={cn(
                "flex flex-col gap-3 rounded-2xl px-2 py-3",
                picked.has(product.id) && "bg-primary/4",
              )}
            >
              <div className="flex items-start gap-3">
                {canSelect && (
                  <span className="pt-3.5">
                    <Checkbox
                      label={`Ընտրել՝ ${product.title}`}
                      checked={picked.has(product.id)}
                      onChange={(on) => toggle([product.id], on)}
                    />
                  </span>
                )}
                <ProductThumb src={product.imageUrl} alt="" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium break-words">{product.title}</p>
                  <p className="text-sm tabular-nums">
                    {formatMoney(product.price)}
                    {showsKind && (
                      <span className="text-muted-foreground">
                        {" · "}
                        {ITEM_KIND_LABELS[itemKind(businessType, product.stock)]}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {fields.length > 0 && (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                  {fields.map((field) => (
                    <div key={field.name} className="min-w-0">
                      <dt className="text-xs text-muted-foreground">
                        {field.label.replace(" (֏)", "")}
                      </dt>
                      <dd className="break-words tabular-nums">
                        {formatCell(field, product)}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
              <ProductRowActions product={product} />
            </li>
          ))}
        </ul>
      </div>

      <Table className="hidden lg:table">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {canSelect && (
              <TableHead className="w-10 pl-4">
                <Checkbox
                  label="Ընտրել էջի բոլորը"
                  checked={allOnPage}
                  indeterminate={pageSelected > 0 && !allOnPage}
                  onChange={(on) => toggle(pageIds, on)}
                />
              </TableHead>
            )}
            <TableHead className={CELL_X}>Անվանում</TableHead>
            {showsKind && <TableHead className={CELL_X}>Տեսակ</TableHead>}
            <TableHead className={cn(CELL_X, "text-right")}>Գին</TableHead>
            {fields.map((field) => (
              <TableHead
                key={field.name}
                className={cn(
                  CELL_X,
                  "whitespace-normal",
                  field.kind !== "text" && "text-right",
                )}
              >
                {field.label.replace(" (֏)", "")}
              </TableHead>
            ))}
            <TableHead className={cn(CELL_X, "text-right")}>
              <span className="sr-only">Գործողություններ</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow
              key={product.id}
              data-state={picked.has(product.id) ? "selected" : undefined}
              className={ROW_CLASS}
            >
              {canSelect && (
                <TableCell className="w-10 pl-4">
                  <Checkbox
                    label={`Ընտրել՝ ${product.title}`}
                    checked={picked.has(product.id)}
                    onChange={(on) => toggle([product.id], on)}
                  />
                </TableCell>
              )}
              <TableCell className={cn(CELL_X, "font-medium")}>
                <span className="flex items-center gap-3">
                  <ProductThumb src={product.imageUrl} alt="" />
                  <TruncatedText className="max-w-40 xl:max-w-64">
                    {product.title}
                  </TruncatedText>
                </span>
              </TableCell>
              {showsKind && (
                <TableCell className={cn(CELL_X, "text-muted-foreground")}>
                  {ITEM_KIND_LABELS[itemKind(businessType, product.stock)]}
                </TableCell>
              )}
              <TableCell className={cn(CELL_X, "text-right tabular-nums")}>
                {formatMoney(product.price)}
              </TableCell>
              {fields.map((field) => (
                <TableCell
                  key={field.name}
                  className={cn(
                    CELL_X,
                    "text-muted-foreground",
                    field.kind !== "text" && "text-right tabular-nums",
                  )}
                >
                  {formatCell(field, product)}
                </TableCell>
              ))}
              <TableCell className={cn(CELL_X, "text-right")}>
                <ProductRowActions product={product} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
