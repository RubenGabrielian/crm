"use client";

import { useEffect, useState, useTransition } from "react";
import { LoaderCircle, Search, UserCheck, UserPlus, X } from "lucide-react";
import { cn } from "cn";
import { searchCustomers, type CustomerOption } from "@/lib/customers/actions";

/**
 * Find an existing customer by name or phone, or leave it empty for a new
 * one. Orders are matched to customers by phone, so picking one just fills in
 * their details.
 */
export function CustomerPicker({
  picked,
  onPick,
}: {
  picked: CustomerOption | null;
  onPick: (customer: CustomerOption | null) => void;
}) {
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<CustomerOption[]>([]);
  const [pending, startTransition] = useTransition();

  // Search a moment after typing stops.
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => {
      startTransition(async () => setResults(await searchCustomers(term)));
    }, 250);
    return () => window.clearTimeout(id);
  }, [term, open]);

  if (picked) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-primary/40 bg-primary/5 px-3 py-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <UserCheck className="size-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{picked.name}</span>
          <span className="block truncate text-xs text-muted-foreground">
            Գոյություն ունեցող հաճախորդ{picked.phone ? ` · ${picked.phone}` : ""}
          </span>
        </span>
        <button
          type="button"
          onClick={() => onPick(null)}
          className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground outline-none hover:bg-card hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-3.5" aria-hidden />
          Նոր հաճախորդ
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-1.5">
      <label htmlFor="order-customer-search" className="text-sm font-medium">
        Հաճախորդ
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          id="order-customer-search"
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls="order-customer-results"
          aria-autocomplete="list"
          value={term}
          onChange={(event) => setTerm(event.currentTarget.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape" && open) {
              // Close the list, not the dialog.
              event.stopPropagation();
              setOpen(false);
            }
          }}
          placeholder="Փնտրել ըստ անվան կամ հեռախոսի"
          autoComplete="off"
          className="h-10 w-full rounded-xl border border-input bg-card pr-9 pl-9 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 [&::-webkit-search-cancel-button]:hidden"
        />
        {pending && (
          <LoaderCircle
            className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
            aria-hidden
          />
        )}
      </div>

      {open && (
        <ul
          id="order-customer-results"
          role="listbox"
          aria-label="Հաճախորդներ"
          className="grid max-h-56 gap-0.5 overflow-y-auto rounded-2xl border bg-card p-1"
        >
          {results.map((customer) => (
            <li key={customer.id} role="option" aria-selected={false}>
              <button
                type="button"
                onClick={() => {
                  onPick(customer);
                  setOpen(false);
                  setTerm("");
                }}
                className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left outline-none hover:bg-muted focus-visible:bg-muted"
              >
                <span
                  aria-hidden
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-apricot text-xs font-semibold text-foreground"
                >
                  {customer.name.charAt(0)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{customer.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {[customer.phone, customer.lastAddress].filter(Boolean).join(" · ") || "—"}
                  </span>
                </span>
              </button>
            </li>
          ))}
          {!pending && results.length === 0 && (
            <li className="px-3 py-2 text-xs text-muted-foreground">
              {term.trim() ? "Այսպիսի հաճախորդ չկա։" : "Դեռ հաճախորդներ չկան։"}
            </li>
          )}
          <li>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={cn(
                "flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm font-medium text-primary outline-none hover:bg-muted focus-visible:bg-muted",
                results.length > 0 && "border-t",
              )}
            >
              <UserPlus className="size-4" aria-hidden />
              Գրանցել նոր հաճախորդ
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
