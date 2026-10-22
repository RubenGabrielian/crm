"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type SelectMenuOption = {
  value: string;
  label: string;
  /** Second line or right-hand note, e.g. a price or "sold out". */
  hint?: string;
  /** Tailwind background class of a small colored dot before the label. */
  dot?: string;
  disabled?: boolean;
};

/**
 * A form dropdown in the app's own style (instead of the browser's select).
 * The value is sent with the form through a hidden input named `name`.
 */
export function SelectMenu({
  id,
  name,
  value,
  onChange,
  options,
  placeholder = "Ընտրեք",
  emptyOption,
  invalid,
  className,
  "aria-label": ariaLabel,
}: {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectMenuOption[];
  /** Shown on the button while nothing is chosen. */
  placeholder?: string;
  /** A first choice for "none", e.g. "Աղբյուր չկա"; its value is "". */
  emptyOption?: string;
  invalid?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  const current = options.find((option) => option.value === value);
  const shown = current?.label ?? (value === "" && emptyOption) ?? null;

  return (
    <>
      {name && <input type="hidden" name={name} value={value} />}
      <DropdownMenu>
        <DropdownMenuTrigger
          id={id}
          aria-label={ariaLabel}
          aria-invalid={invalid || undefined}
          className={cn(
            "group/select flex h-10 w-full min-w-0 items-center gap-2 rounded-xl border border-input bg-card px-3 text-left text-sm outline-none transition-colors",
            "hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:border-ring data-popup-open:ring-3 data-popup-open:ring-ring/30",
            "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30",
            className,
          )}
        >
          {current?.dot && (
            <span
              aria-hidden
              className={cn("size-2 shrink-0 rounded-full", current.dot)}
            />
          )}
          <span
            className={cn(
              "min-w-0 flex-1 truncate",
              !shown && "text-muted-foreground",
            )}
          >
            {shown || placeholder}
          </span>
          <ChevronDown
            className="size-4 shrink-0 text-muted-foreground transition-transform group-data-popup-open/select:rotate-180"
            aria-hidden
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={6}
          className="max-h-72 min-w-(--anchor-width) rounded-xl p-1.5"
        >
          <DropdownMenuRadioGroup
            value={value}
            onValueChange={(next) => onChange(String(next))}
          >
            {emptyOption && (
              <>
                <DropdownMenuRadioItem
                  value=""
                  closeOnClick
                  className="rounded-lg py-2 pl-2"
                >
                  <span className="text-muted-foreground">{emptyOption}</span>
                </DropdownMenuRadioItem>
                {options.length > 0 && (
                  <DropdownMenuSeparator className="my-1.5" />
                )}
              </>
            )}
            {options.map((option) => (
              <DropdownMenuRadioItem
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                closeOnClick
                className="gap-2.5 rounded-lg py-2 pl-2"
              >
                {option.dot && (
                  <span
                    aria-hidden
                    className={cn("size-2 shrink-0 rounded-full", option.dot)}
                  />
                )}
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {option.hint && (
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {option.hint}
                  </span>
                )}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
