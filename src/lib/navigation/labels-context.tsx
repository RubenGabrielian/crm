"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { NavLabels } from "@/config/navigation";

const NavLabelsContext = createContext<{
  labels: NavLabels;
  setLabel: (href: string, label: string) => void;
}>({ labels: {}, setLabel: () => {} });

/** The user's own menu names; renaming shows at once, before the save returns. */
export function NavLabelsProvider({
  labels: initial,
  children,
}: {
  labels: NavLabels;
  children: ReactNode;
}) {
  const [labels, setLabels] = useState(initial);
  const setLabel = (href: string, label: string) =>
    setLabels((current) => {
      const next = { ...current };
      if (label.trim()) next[href] = label.trim();
      else delete next[href];
      return next;
    });
  return <NavLabelsContext value={{ labels, setLabel }}>{children}</NavLabelsContext>;
}

export function useNavLabels() {
  return useContext(NavLabelsContext);
}
