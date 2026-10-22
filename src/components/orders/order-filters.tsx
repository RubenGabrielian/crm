"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { Popover } from "@base-ui/react/popover";
import {
  CalendarRange,
  ChevronDown,
  CircleDot,
  LoaderCircle,
  Megaphone,
  Package,
  Wallet,
  WalletCards,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
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
import { useNavigate } from "@/components/layout/navigation-progress";
import { STATUS_DOT } from "@/components/orders/orders-calendar";
import {
  NO_SOURCE,
  ORDER_FILTER_KEYS,
  ORDER_STATUSES,
  type OrderFilters,
  type OrderStatus,
} from "@/config/orders";
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from "@/config/payments";

/** Same look as the search field's "search by" picker. */
const CHIP =
  "group/chip flex h-11 max-w-64 shrink-0 items-center gap-2 rounded-2xl border bg-card pr-2.5 pl-2 text-sm shadow-soft outline-none transition-colors hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/40 data-popup-open:bg-muted/50";
const CHIP_IDLE = "border-input text-muted-foreground";
const CHIP_ACTIVE = "border-primary/40 bg-primary/5 font-medium text-foreground";
const MENU = "w-64 rounded-xl p-1.5";
const ITEM = "gap-2.5 rounded-lg py-2 pl-2";

type Option = { value: string; label: string; dot?: string };

/**
 * Filters for the orders page, one button each. Every choice navigates to the
 * same page with the filter in the URL, so paging, search and the calendar
 * keep it.
 */
export function OrderFilterBar({
  filters,
  keep,
  statusLabels,
  sources,
  products,
  itemLabel,
  allItemsLabel,
  showDates,
  today,
}: {
  filters: OrderFilters;
  /** Other params to keep (search, view, month, …). */
  keep: Record<string, string | undefined>;
  statusLabels: Record<OrderStatus, string>;
  sources: string[];
  products: { id: string; title: string }[];
  /** "Product" / "Course". */
  itemLabel: string;
  /** "All products" / "All courses". */
  allItemsLabel: string;
  /** The calendar picks its own month, so dates are only shown on the list. */
  showDates: boolean;
  /** Today in Yerevan, YYYY-MM-DD, for the date shortcuts. */
  today: string;
}) {
  const navigate = useNavigate();
  const [pending, startTransition] = useTransition();
  // The filter being applied gets the spinner until the results arrive.
  const [changing, setChanging] = useState<string | null>(null);

  function hrefWith(changes: Partial<Record<keyof OrderFilters, string>>) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(keep)) if (value) params.set(key, value);
    const next = { ...filters, ...changes };
    for (const key of ORDER_FILTER_KEYS) {
      const value = next[key];
      if (value) params.set(key, value);
    }
    const text = params.toString();
    return text ? `/orders?${text}` : "/orders";
  }

  function apply(changes: Partial<Record<keyof OrderFilters, string>>) {
    setChanging(Object.keys(changes)[0] ?? null);
    startTransition(() => navigate(hrefWith(changes)));
  }
  const loading = (key: keyof OrderFilters) => pending && changing === key;

  const active = ORDER_FILTER_KEYS.filter(
    (key) => filters[key] && (showDates || (key !== "from" && key !== "to")),
  ).length;
  const clearHref = hrefWith(
    Object.fromEntries(ORDER_FILTER_KEYS.map((key) => [key, ""])),
  );

  const menu = (
    key: keyof OrderFilters,
    icon: LucideIcon,
    name: string,
    allLabel: string,
    options: Option[],
  ) => (
    <FilterMenu
      icon={icon}
      name={name}
      allLabel={allLabel}
      options={options}
      value={filters[key] ?? ""}
      onChange={(value) => apply({ [key]: value })}
      loading={loading(key)}
    />
  );

  return (
    <div
      role="group"
      aria-label="Ֆիլտրեր"
      aria-busy={pending}
      className="flex flex-wrap items-center gap-2"
    >
      {menu(
        "status",
        CircleDot,
        "Կարգավիճակ",
        "Բոլոր կարգավիճակները",
        ORDER_STATUSES.map((value) => ({
          value,
          label: statusLabels[value],
          dot: STATUS_DOT[value],
        })),
      )}
      {menu("paid", Wallet, "Վճարում", "Վճարված և չվճարված", [
        { value: "yes", label: "Վճարված", dot: "bg-emerald-500" },
        { value: "no", label: "Չվճարված", dot: "bg-red-500" },
      ])}
      {menu(
        "payment",
        WalletCards,
        "Վճարման եղանակ",
        "Բոլոր եղանակները",
        PAYMENT_METHODS.map((value) => ({
          value,
          label: PAYMENT_METHOD_LABELS[value],
        })),
      )}
      {menu("source", Megaphone, "Աղբյուր", "Բոլոր աղբյուրները", [
        ...sources.map((name) => ({ value: name, label: name })),
        { value: NO_SOURCE, label: "Աղբյուր չկա" },
      ])}
      {products.length > 0 &&
        menu(
          "product",
          Package,
          itemLabel,
          allItemsLabel,
          products.map((product) => ({ value: product.id, label: product.title })),
        )}
      {showDates && (
        <DateFilter
          from={filters.from}
          to={filters.to}
          today={today}
          onChange={(from, to) => apply({ from, to })}
          loading={loading("from")}
        />
      )}

      {active > 0 && (
        <Link
          href={clearHref}
          className="flex h-11 items-center gap-1.5 rounded-2xl px-3 text-sm font-medium text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" aria-hidden />
          Մաքրել ({active})
        </Link>
      )}
      {pending && <SearchingNote />}
    </div>
  );
}

/** "Searching…" with a spinner, shown next to the filters while results load. */
export function SearchingNote() {
  return (
    <span
      role="status"
      className="flex h-11 items-center gap-2 px-2 text-sm font-medium text-primary"
    >
      <LoaderCircle className="size-4 animate-spin" aria-hidden />
      Որոնում…
    </span>
  );
}

function ChipContent({
  icon: Icon,
  name,
  value,
  loading,
}: {
  icon: LucideIcon;
  name: string;
  /** The chosen option's label; the filter's name when nothing is chosen. */
  value: ReactNode | null;
  /** Spinner instead of the chevron while this filter's results load. */
  loading?: boolean;
}) {
  return (
    <>
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-lg",
          value ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
        )}
      >
        <Icon className="size-3.5" aria-hidden />
      </span>
      <span className="min-w-0 truncate">{value ?? name}</span>
      {loading ? (
        <LoaderCircle className="size-4 shrink-0 animate-spin text-primary" aria-hidden />
      ) : (
        <ChevronDown
          className="size-4 shrink-0 text-muted-foreground transition-transform group-data-popup-open/chip:rotate-180"
          aria-hidden
        />
      )}
    </>
  );
}

export function FilterMenu({
  icon,
  name,
  allLabel,
  options,
  value,
  onChange,
  loading = false,
}: {
  icon: LucideIcon;
  name: string;
  allLabel: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  loading?: boolean;
}) {
  const current = options.find((option) => option.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={current ? `${name}՝ ${current.label}` : name}
        className={cn(CHIP, current ? CHIP_ACTIVE : CHIP_IDLE)}
      >
        <ChipContent
          icon={icon}
          name={name}
          loading={loading}
          value={
            current ? (
              <>
                {current.dot && (
                  <span
                    aria-hidden
                    className={cn("mr-1.5 inline-block size-2 rounded-full align-middle", current.dot)}
                  />
                )}
                {current.label}
              </>
            ) : null
          }
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8} className={cn(MENU, "max-h-80")}>
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 text-xs text-muted-foreground">
            {name}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuRadioGroup value={value} onValueChange={(next) => onChange(String(next))}>
          <DropdownMenuRadioItem value="" closeOnClick className={ITEM}>
            {allLabel}
          </DropdownMenuRadioItem>
          <DropdownMenuSeparator className="my-1.5" />
          {options.map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              value={option.value}
              closeOnClick
              className={ITEM}
            >
              {option.dot && (
                <span aria-hidden className={cn("size-2 shrink-0 rounded-full", option.dot)} />
              )}
              <span className="truncate">{option.label}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** "16.10" or "16.10.2025" when not this year. */
function shortDay(day: string, today: string) {
  const [year, month, date] = day.split("-");
  return year === today.slice(0, 4) ? `${date}.${month}` : `${date}.${month}.${year}`;
}

function shiftDay(day: string, days: number) {
  return new Date(Date.parse(`${day}T00:00:00Z`) + days * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

function DateFilter({
  from,
  to,
  today,
  onChange,
  loading,
}: {
  from: string | undefined;
  to: string | undefined;
  today: string;
  onChange: (from: string, to: string) => void;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(from ?? "");
  const [draftTo, setDraftTo] = useState(to ?? "");

  const presets = [
    { label: "Այսօր", from: today, to: today },
    { label: "Երեկ", from: shiftDay(today, -1), to: shiftDay(today, -1) },
    { label: "Վերջին 7 օրը", from: shiftDay(today, -6), to: today },
    { label: "Վերջին 30 օրը", from: shiftDay(today, -29), to: today },
    { label: "Այս ամիսը", from: `${today.slice(0, 8)}01`, to: today },
  ];
  const preset = presets.find((item) => item.from === from && item.to === to);
  const value =
    preset?.label ??
    (from && to
      ? from === to
        ? shortDay(from, today)
        : `${shortDay(from, today)} – ${shortDay(to, today)}`
      : from
        ? `${shortDay(from, today)}-ից`
        : to
          ? `մինչև ${shortDay(to, today)}`
          : null);

  function pick(nextFrom: string, nextTo: string) {
    setOpen(false);
    onChange(nextFrom, nextTo);
  }

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // Each opening starts from the dates in the URL.
        if (next) {
          setDraftFrom(from ?? "");
          setDraftTo(to ?? "");
        }
      }}
    >
      <Popover.Trigger
        aria-label={value ? `Ամսաթիվ՝ ${value}` : "Ամսաթիվ"}
        className={cn(CHIP, value ? CHIP_ACTIVE : CHIP_IDLE)}
      >
        <ChipContent icon={CalendarRange} name="Ամսաթիվ" value={value} loading={loading} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner align="start" sideOffset={8} className="isolate z-50">
          <Popover.Popup className="w-72 origin-(--transform-origin) rounded-xl bg-popover p-1.5 text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Ամսաթիվ</p>
            <ul className="grid">
              {presets.map((item) => (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() => pick(item.from, item.to)}
                    className={cn(
                      "flex w-full items-center rounded-lg px-2 py-2 text-left text-sm outline-none hover:bg-accent focus-visible:bg-accent",
                      preset?.label === item.label && "font-medium text-primary",
                    )}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
            <div className="my-1.5 h-px bg-border" />
            <form
              className="grid gap-2 p-2"
              onSubmit={(event) => {
                event.preventDefault();
                pick(draftFrom, draftTo);
              }}
            >
              <div className="grid grid-cols-2 gap-2">
                <label className="grid gap-1 text-xs text-muted-foreground">
                  Սկսած
                  <input
                    type="date"
                    value={draftFrom}
                    max={draftTo || undefined}
                    onChange={(event) => setDraftFrom(event.currentTarget.value)}
                    className="h-9 w-full rounded-lg border border-input bg-card px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                  />
                </label>
                <label className="grid gap-1 text-xs text-muted-foreground">
                  Մինչև
                  <input
                    type="date"
                    value={draftTo}
                    min={draftFrom || undefined}
                    onChange={(event) => setDraftTo(event.currentTarget.value)}
                    className="h-9 w-full rounded-lg border border-input bg-card px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                  />
                </label>
              </div>
              <div className="flex justify-end gap-2">
                {(from || to) && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => pick("", "")}>
                    Մաքրել
                  </Button>
                )}
                <Button type="submit" size="sm" disabled={!draftFrom && !draftTo}>
                  Կիրառել
                </Button>
              </div>
            </form>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
