"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { getNewOrderCount } from "@/lib/orders/new-count";

const REFRESH_MS = 30_000;

const NewOrdersContext = createContext<{ count: number; refresh: () => void }>({
  count: 0,
  refresh: () => {},
});

/**
 * Keeps the number of "new" orders fresh while the admin panel is open:
 * on every page change, when the tab regains focus, and every 30 seconds
 * (orders can arrive from the public checkout at any time).
 */
export function NewOrdersProvider({
  initialCount,
  children,
}: {
  initialCount: number;
  children: ReactNode;
}) {
  const [count, setCount] = useState(initialCount);
  const pathname = usePathname();

  const refresh = useCallback(() => {
    getNewOrderCount()
      .then(setCount)
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Background checks are skipped while the tab is not being looked at.
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };

    refresh();
    const timer = setInterval(refreshIfVisible, REFRESH_MS);
    document.addEventListener("visibilitychange", refreshIfVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [pathname, refresh]);

  return <NewOrdersContext value={{ count, refresh }}>{children}</NewOrdersContext>;
}

export function useNewOrderCount() {
  return useContext(NewOrdersContext).count;
}

/** Call after changing an order so the badge updates without waiting. */
export function useRefreshNewOrders() {
  return useContext(NewOrdersContext).refresh;
}
