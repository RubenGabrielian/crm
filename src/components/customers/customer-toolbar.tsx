"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowUpDown,
  AtSign,
  ChevronDown,
  Layers,
  MapPin,
  MessageSquareText,
  Package,
  Phone,
  Search,
  User,
  X,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "@/components/layout/navigation-progress";
import { FilterMenu, SearchingNote } from "@/components/orders/order-filters";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CUSTOMER_SEARCH_FIELDS,
  type CustomerSearchField,
} from "@/config/customers";
import { useNavLabels } from "@/lib/navigation/labels-context";

const FIELD_ICONS: Record<CustomerSearchField, LucideIcon> = {
  all: Layers,
  name: User,
  phone: Phone,
  email: AtSign,
  address: MapPin,
  comment: MessageSquareText,
};

export type CustomerSort = "recent" | "orders" | "spent" | "average";

/**
 * Search, sorting and the product filter of the CRM page, in one row and in
 * the same style as the orders page. Everything lives in the URL.
 */
export function CustomerToolbar({
  search,
  searchBy: initialBy,
  showAddress,
  sort,
  sortLabels,
  product,
  products,
  itemLabel,
  allItemsLabel,
}: {
  search: string;
  searchBy: CustomerSearchField;
  /** Shops keep delivery addresses; courses don't. */
  showAddress: boolean;
  sort: CustomerSort;
  sortLabels: Record<CustomerSort, string>;
  product: string;
  products: { id: string; title: string }[];
  /** "Product" / "Course". */
  itemLabel: string;
  /** "All products" / "All courses". */
  allItemsLabel: string;
}) {
  const navigate = useNavigate();
  const [pending, startTransition] = useTransition();
  // The control being applied gets the spinner until the results arrive.
  const [changing, setChanging] = useState<"sort" | "product" | null>(null);
  const [by, setBy] = useState<CustomerSearchField>(initialBy);
  const { commentLabel } = useNavLabels();
  const fieldLabels: Record<CustomerSearchField, string> = {
    all: "Բոլոր դաշտերը",
    name: "Անուն",
    phone: "Հեռախոս",
    email: "Էլ. փոստ",
    address: "Հասցե",
    comment: commentLabel,
  };
  const placeholders: Record<CustomerSearchField, string> = {
    all: "Անուն, հեռախոս, էլ. փոստ…",
    name: "օր.՝ Անի Հակոբյան",
    phone: "օր.՝ 091 123 456",
    email: "օր.՝ name@mail.com",
    address: "Քաղաք, փողոց",
    comment: "Տեքստի մի հատված",
  };
  const fields = CUSTOMER_SEARCH_FIELDS.filter(
    (field) => showAddress || field !== "address",
  );
  const FieldIcon = FIELD_ICONS[by];

  function hrefWith(next: { q?: string; sort?: string; product?: string }) {
    const params = new URLSearchParams();
    const q = next.q ?? search;
    const nextSort = next.sort ?? sort;
    const nextProduct = next.product ?? product;
    if (q) params.set("q", q);
    if (q && by !== "all") params.set("by", by);
    if (nextSort && nextSort !== "recent") params.set("sort", nextSort);
    if (nextProduct) params.set("product", nextProduct);
    const text = params.toString();
    return text ? `/customers?${text}` : "/customers";
  }

  function apply(key: "sort" | "product", value: string) {
    setChanging(key);
    startTransition(() => navigate(hrefWith({ [key]: value })));
  }

  const filtered = Boolean(search || product || sort !== "recent");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form
        action="/customers"
        role="search"
        className="flex h-11 w-full max-w-xl min-w-64 flex-1 items-center rounded-2xl border border-input bg-card shadow-soft transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/40 sm:w-auto dark:bg-input/30"
      >
        {sort !== "recent" && <input type="hidden" name="sort" value={sort} />}
        {product && <input type="hidden" name="product" value={product} />}
        {by !== "all" && <input type="hidden" name="by" value={by} />}

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`Որոնել ըստ՝ ${fieldLabels[by]}`}
            className="group/by flex h-full shrink-0 items-center gap-2 rounded-l-2xl pr-2.5 pl-3 text-sm font-medium outline-none transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 data-popup-open:bg-muted/60"
          >
            <span className="flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FieldIcon className="size-3.5" />
            </span>
            <span className="max-w-32 truncate">{fieldLabels[by]}</span>
            <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-popup-open/by:rotate-180" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            sideOffset={8}
            className="w-60 rounded-xl p-1.5"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-2 text-xs text-muted-foreground">
                Որոնել ըստ
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuRadioGroup
              value={by}
              onValueChange={(value) => setBy(value as CustomerSearchField)}
            >
              {fields.map((field, index) => {
                const Icon = FIELD_ICONS[field];
                return (
                  <div key={field}>
                    {index === 1 && (
                      <DropdownMenuSeparator className="my-1.5" />
                    )}
                    <DropdownMenuRadioItem
                      value={field}
                      closeOnClick
                      className="gap-2.5 rounded-lg py-2 pl-2"
                    >
                      <Icon className="text-muted-foreground" />
                      {fieldLabels[field]}
                    </DropdownMenuRadioItem>
                  </div>
                );
              })}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <span aria-hidden className="h-6 w-px shrink-0 bg-border" />
        <label htmlFor="customer-search" className="sr-only">
          Որոնել հաճախորդ
        </label>
        <input
          id="customer-search"
          name="q"
          type="search"
          defaultValue={search}
          placeholder={placeholders[by]}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
        />
        {search && (
          <Link
            href={hrefWith({ q: "" })}
            aria-label="Մաքրել որոնումը"
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" />
          </Link>
        )}
        <button
          type="submit"
          aria-label="Որոնել"
          className="mx-1 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        >
          <Search className="size-4" />
        </button>
      </form>

      <FilterMenu
        icon={ArrowUpDown}
        name="Դասավորել"
        allLabel={sortLabels.recent}
        options={(["orders", "spent", "average"] as const).map((key) => ({
          value: key,
          label: sortLabels[key],
        }))}
        value={sort === "recent" ? "" : sort}
        onChange={(value) => apply("sort", value || "recent")}
        loading={pending && changing === "sort"}
      />

      {products.length > 0 && (
        <FilterMenu
          icon={Package}
          name={itemLabel}
          allLabel={allItemsLabel}
          options={products.map((item) => ({
            value: item.id,
            label: item.title,
          }))}
          value={product}
          onChange={(value) => apply("product", value)}
          loading={pending && changing === "product"}
        />
      )}

      {filtered && (
        <Link
          href="/customers"
          className="flex h-11 items-center gap-1.5 rounded-2xl px-3 text-sm font-medium text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" aria-hidden />
          Մաքրել
        </Link>
      )}
      {pending && <SearchingNote />}
    </div>
  );
}
