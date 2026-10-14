"use client";

import { createContext, use } from "react";

export type MaterialOption = {
  id: string;
  name: string;
  unit: string;
  unitCost: number;
};

const MaterialsContext = createContext<MaterialOption[]>([]);

/** Gives product forms the tenant's warehouse materials to pick from. */
export function MaterialsProvider({
  materials,
  children,
}: {
  materials: MaterialOption[];
  children: React.ReactNode;
}) {
  return <MaterialsContext value={materials}>{children}</MaterialsContext>;
}

export function useMaterials() {
  return use(MaterialsContext);
}
