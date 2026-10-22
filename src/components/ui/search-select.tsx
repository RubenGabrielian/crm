"use client";

import { useState } from "react";
import { Combobox } from "@base-ui/react/combobox";
import { CheckIcon, ChevronDown, Search } from "lucide-react";
import { cn } from "cn";
import type { SelectMenuOption } from "@/components/ui/select-menu";
import { TruncatedText } from "@/components/ui/truncated-text";

/**
 * Like SelectMenu, but the list opens with a search box on top, for long
 * lists such as the catalog. Matches options by their label.
 */
export function SearchSelect({
  value,
  onChange,
  options,
  placeholder = "Ընտրեք",
  searchPlaceholder = "Որոնել անունով…",
  emptyText = "Ոչինչ չի գտնվել",
  invalid,
  className,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectMenuOption[];
  /** Shown on the button while nothing is chosen. */
  placeholder?: string;
  searchPlaceholder?: string;
  /** Shown when the search matches nothing. */
  emptyText?: string;
  invalid?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  const current = options.find((option) => option.value === value) ?? null;
  // Every opening starts with an empty search box.
  const [query, setQuery] = useState("");

  return (
    <Combobox.Root
      items={options}
      value={current}
      onValueChange={(next: SelectMenuOption | null) => {
        if (next) onChange(next.value);
      }}
      isItemEqualToValue={(a, b) => a?.value === b?.value}
      itemToStringLabel={(option) => option?.label ?? ""}
      inputValue={query}
      onInputValueChange={setQuery}
      onOpenChange={(open) => {
        if (!open) setQuery("");
      }}
    >
      <Combobox.Trigger
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        className={cn(
          "group/select flex h-10 w-full min-w-0 items-center gap-2 rounded-xl border border-input bg-card px-3 text-left text-sm outline-none transition-colors",
          "hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:border-ring data-popup-open:ring-3 data-popup-open:ring-ring/30",
          "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30",
          className,
        )}
      >
        <TruncatedText
          className={cn("min-w-0 flex-1", !current && "text-muted-foreground")}
        >
          {current?.label ?? placeholder}
        </TruncatedText>
        <ChevronDown
          className="size-4 shrink-0 text-muted-foreground transition-transform group-data-popup-open/select:rotate-180"
          aria-hidden
        />
      </Combobox.Trigger>
      <Combobox.Portal>
        <Combobox.Positioner
          align="start"
          sideOffset={6}
          className="isolate z-50 outline-none"
        >
          <Combobox.Popup
            aria-label={ariaLabel}
            className="flex max-h-[min(22rem,var(--available-height))] w-(--anchor-width) min-w-64 origin-(--transform-origin) flex-col overflow-hidden rounded-xl bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none transition-[opacity,transform] duration-100 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0"
          >
            <div className="flex items-center gap-2 border-b border-border px-3">
              <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <Combobox.Input
                placeholder={searchPlaceholder}
                className="h-10 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground any-pointer-coarse:text-base"
              />
            </div>
            <Combobox.Empty className="px-3 py-4 text-sm text-muted-foreground empty:hidden">
              {emptyText}
            </Combobox.Empty>
            <Combobox.List className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5 empty:hidden">
              {(option: SelectMenuOption) => (
                <Combobox.Item
                  key={option.value}
                  value={option}
                  disabled={option.disabled}
                  className="relative flex cursor-default items-center gap-2.5 rounded-lg py-2 pr-8 pl-2 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                >
                  {option.dot && (
                    <span
                      aria-hidden
                      className={cn("size-2 shrink-0 rounded-full", option.dot)}
                    />
                  )}
                  <TruncatedText className="min-w-0 flex-1">
                    {option.label}
                  </TruncatedText>
                  {option.hint && (
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {option.hint}
                    </span>
                  )}
                  <Combobox.ItemIndicator className="pointer-events-none absolute right-2 flex items-center">
                    <CheckIcon className="size-4" />
                  </Combobox.ItemIndicator>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
