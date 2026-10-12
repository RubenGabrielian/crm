"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import { getNavigation, isActivePath } from "@/config/navigation";
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
  const items = getNavigation(tenant.businessType);
  const newOrders = useNewOrderCount();

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
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-apricot text-base font-semibold text-primary"
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
          {items.map(({ href, label, icon: Icon, showsNewOrders }) => {
            const active = isActivePath(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium outline-none transition-colors",
                    "hover:bg-sidebar-hover hover:text-sidebar-strong focus-visible:ring-2 focus-visible:ring-ring",
                    // The current page is a solid black pill.
                    active &&
                      "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                  )}
                >
                  <Icon
                    className="size-[18px] shrink-0"
                    strokeWidth={1.75}
                  />
                  {label}
                  {showsNewOrders && newOrders > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-apricot px-1.5 text-xs font-semibold tabular-nums text-primary">
                      {newOrders > 99 ? "99+" : newOrders}
                      <span className="sr-only"> նոր</span>
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
