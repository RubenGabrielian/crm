"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, Pencil, RotateCcw, X } from "lucide-react";
import { cn } from "cn";
import {
  NAV_LABEL_MAX,
  getNavigation,
  isActivePath,
  type NavItem,
} from "@/config/navigation";
import { renameNavItem } from "@/lib/navigation/actions";
import { useNavLabels } from "@/lib/navigation/labels-context";
import { BUSINESS_TYPE_LABELS } from "@/lib/tenant/features";
import { useTenant } from "@/lib/tenant/tenant-context";
import { useNewOrderCount } from "./new-orders";

export function Sidebar({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const tenant = useTenant();
  const pathname = usePathname();
  const { labels } = useNavLabels();
  const items = getNavigation(tenant.businessType, labels);
  const newOrders = useNewOrderCount();
  // The item being renamed; only one at a time.
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <aside
      className={cn(
        "flex h-full w-60 flex-col bg-sidebar text-sidebar-foreground",
        className,
      )}
    >
      <div className="mx-4 mb-3 flex items-center gap-3 border-b px-1 pt-6 pb-5">
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-apricot text-base font-semibold text-foreground"
        >
          {tenant.name.charAt(0)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-sidebar-strong">
            {tenant.name}
          </p>
          <p className="truncate text-xs">
            {BUSINESS_TYPE_LABELS[tenant.businessType]}
          </p>
        </div>
      </div>

      <nav aria-label="Հիմնական մենյու" className="flex-1 overflow-y-auto px-3 pb-4">
        <ul className="flex flex-col gap-0.5">
          {items.map((item) =>
            editing === item.href ? (
              <li key={item.href}>
                <RenameForm item={item} onDone={() => setEditing(null)} />
              </li>
            ) : (
              <li key={item.href} className="group/item relative">
                <MenuLink
                  item={item}
                  active={isActivePath(pathname, item.href)}
                  badge={item.showsNewOrders ? newOrders : 0}
                  onNavigate={onNavigate}
                />
                <button
                  type="button"
                  onClick={() => setEditing(item.href)}
                  aria-label={`Վերանվանել՝ ${item.label}`}
                  title="Վերանվանել"
                  className={cn(
                    "absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-full opacity-0 outline-none transition-opacity",
                    "group-hover/item:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring",
                    // Always visible on touch screens, which have no hover.
                    "pointer-coarse:opacity-60",
                    isActivePath(pathname, item.href)
                      ? "text-primary-foreground hover:bg-white/15"
                      : "text-muted-foreground hover:bg-sidebar-hover hover:text-sidebar-strong",
                  )}
                >
                  <Pencil className="size-3.5" aria-hidden />
                </button>
              </li>
            ),
          )}
        </ul>
      </nav>
    </aside>
  );
}

function MenuLink({
  item: { href, label, icon: Icon },
  active,
  badge,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  badge: number;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        // Room on the right for the rename pencil.
        "flex items-center gap-3 rounded-full py-2.5 pr-10 pl-4 text-sm font-medium outline-none transition-colors",
        "hover:bg-sidebar-hover hover:text-sidebar-strong focus-visible:ring-2 focus-visible:ring-ring",
        // The current page is a solid black pill.
        active &&
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
      )}
    >
      <Icon className="size-[18px] shrink-0" strokeWidth={1.75} />
      <span className="min-w-0 truncate">{label}</span>
      {badge > 0 && (
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-apricot px-1.5 text-xs font-semibold tabular-nums text-foreground">
          {badge > 99 ? "99+" : badge}
          <span className="sr-only"> նոր</span>
        </span>
      )}
    </Link>
  );
}

/** Inline rename: Enter saves, Esc cancels, an empty name brings back the default. */
function RenameForm({ item, onDone }: { item: NavItem; onDone: () => void }) {
  const { setLabel } = useNavLabels();
  const [value, setValue] = useState(item.label);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const Icon = item.icon;
  const customized = item.label !== item.defaultLabel;

  function save(next: string) {
    setError(null);
    const previous = item.label;
    setLabel(item.href, next);
    startTransition(async () => {
      const result = await renameNavItem(item.href, next);
      if (result.ok) onDone();
      else {
        setLabel(item.href, previous === item.defaultLabel ? "" : previous);
        setError(result.error);
      }
    });
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save(value);
      }}
      className="grid gap-1 rounded-2xl bg-sidebar-hover p-1.5"
    >
      <div className="flex items-center gap-1.5">
        <Icon className="ml-2 size-[18px] shrink-0" strokeWidth={1.75} aria-hidden />
        <input
          value={value}
          onChange={(event) => setValue(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") onDone();
          }}
          maxLength={NAV_LABEL_MAX}
          placeholder={item.defaultLabel}
          aria-label={`Նոր անվանում՝ ${item.defaultLabel}`}
          autoFocus
          onFocus={(event) => event.currentTarget.select()}
          disabled={pending}
          className="h-8 min-w-0 flex-1 rounded-lg border border-input bg-card px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        <button
          type="submit"
          aria-label="Պահպանել"
          disabled={pending}
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-primary outline-none hover:bg-card focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          <Check className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Չեղարկել"
          onClick={onDone}
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-card focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      {customized && (
        <button
          type="button"
          onClick={() => save("")}
          disabled={pending}
          className="ml-8 flex w-fit items-center gap-1 rounded-full px-1.5 py-0.5 text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RotateCcw className="size-3" aria-hidden />
          Վերադարձնել «{item.defaultLabel}»
        </button>
      )}
      {error && <p className="ml-8 text-xs text-destructive">{error}</p>}
    </form>
  );
}
