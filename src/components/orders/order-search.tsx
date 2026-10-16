"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AtSign,
  ChevronDown,
  Hash,
  Layers,
  MapPin,
  MessageSquareText,
  Megaphone,
  Package,
  Phone,
  Search,
  User,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
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
import type { OrderSearchField } from "@/config/orders";

const ICONS: Record<OrderSearchField, LucideIcon> = {
  all: Layers,
  customer: User,
  phone: Phone,
  email: AtSign,
  product: Package,
  order: Hash,
  address: MapPin,
  comment: MessageSquareText,
  source: Megaphone,
};

export type OrderSearchOption = {
  value: OrderSearchField;
  label: string;
  placeholder: string;
};

/** Search box with a field picker; submits ?by=…&q=… to /orders. */
export function OrderSearch({
  options,
  by: initialBy,
  q,
  view = "list",
}: {
  options: OrderSearchOption[];
  by: OrderSearchField;
  q: string;
  /** Kept when searching, so the calendar stays the calendar. */
  view?: "list" | "calendar";
}) {
  const clearHref = view === "calendar" ? "/orders?view=calendar" : "/orders";
  const [by, setBy] = useState<OrderSearchField>(initialBy);
  const current = options.find((option) => option.value === by) ?? options[0];
  const CurrentIcon = ICONS[current.value];

  return (
    <form
      action="/orders"
      role="search"
      className="group/search flex h-11 w-full max-w-xl items-center rounded-2xl border border-input bg-card shadow-soft transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/40 dark:bg-input/30"
    >
      {by !== "all" && <input type="hidden" name="by" value={by} />}
      {view === "calendar" && <input type="hidden" name="view" value="calendar" />}

      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Որոնել ըստ՝ ${current.label}`}
          className="flex h-full shrink-0 items-center gap-2 rounded-l-2xl pr-2.5 pl-3.5 text-sm font-medium outline-none transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 data-popup-open:bg-muted/60"
        >
          <span className="flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CurrentIcon className="size-3.5" />
          </span>
          <span className="max-w-36 truncate">{current.label}</span>
          <ChevronDown className="size-4 text-muted-foreground transition-transform group-has-data-popup-open/search:rotate-180" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={8} className="w-60 rounded-xl p-1.5">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="px-2 text-xs text-muted-foreground">
              Որոնել ըստ
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuRadioGroup
            value={by}
            onValueChange={(value) => setBy(value as OrderSearchField)}
          >
            {options.map((option, index) => {
              const Icon = ICONS[option.value];
              return (
                <div key={option.value}>
                  {index === 1 && <DropdownMenuSeparator className="my-1.5" />}
                  <DropdownMenuRadioItem
                    value={option.value}
                    closeOnClick
                    className="gap-2.5 rounded-lg py-2 pl-2"
                  >
                    <Icon className="text-muted-foreground" />
                    {option.label}
                  </DropdownMenuRadioItem>
                </div>
              );
            })}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <span aria-hidden className="h-6 w-px shrink-0 bg-border" />

      <label htmlFor="order-search" className="sr-only">
        Որոնել պատվեր
      </label>
      <input
        id="order-search"
        name="q"
        type="search"
        defaultValue={q}
        placeholder={current.placeholder}
        className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
      />

      {q && (
        <Link
          href={clearHref}
          aria-label="Մաքրել որոնումը"
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" />
        </Link>
      )}
      <button
        type="submit"
        aria-label="Որոնել"
        className={cn(
          "mr-1 ml-1 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        )}
      >
        <Search className="size-4" />
      </button>
    </form>
  );
}
