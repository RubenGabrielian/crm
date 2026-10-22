"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { NavLabels } from "@/config/navigation";

const NavLabelsContext = createContext<{
  labels: NavLabels;
  setLabel: (href: string, label: string) => void;
  /** The user's name for the customer comment column and field. */
  commentLabel: string;
  setCommentLabel: (label: string) => void;
}>({
  labels: {},
  setLabel: () => {},
  commentLabel: "Մեկնաբանություն",
  setCommentLabel: () => {},
});

/**
 * The user's own names (menu items, the customer comment); renaming shows at
 * once, before the save returns.
 */
export function NavLabelsProvider({
  labels: initial,
  commentLabel: initialComment,
  children,
}: {
  labels: NavLabels;
  commentLabel: string;
  children: ReactNode;
}) {
  const [labels, setLabels] = useState(initial);
  const [commentLabel, setCommentLabel] = useState(initialComment);
  const setLabel = (href: string, label: string) =>
    setLabels((current) => {
      const next = { ...current };
      if (label.trim()) next[href] = label.trim();
      else delete next[href];
      return next;
    });
  return (
    <NavLabelsContext value={{ labels, setLabel, commentLabel, setCommentLabel }}>
      {children}
    </NavLabelsContext>
  );
}

export function useNavLabels() {
  return useContext(NavLabelsContext);
}
