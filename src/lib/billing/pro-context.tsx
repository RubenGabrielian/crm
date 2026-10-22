"use client";

import { createContext, useContext, type ReactNode } from "react";

const ProContext = createContext(false);

export function ProProvider({ isPro, children }: { isPro: boolean; children: ReactNode }) {
  return <ProContext value={isPro}>{children}</ProContext>;
}

/** Whether the signed-in user has an active Numa Pro subscription. */
export function useIsPro(): boolean {
  return useContext(ProContext);
}
