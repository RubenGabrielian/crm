"use client";

import { createContext, useContext, type ReactNode } from "react";
import { hasFeature, type Feature, type Tenant } from "./features";

const TenantContext = createContext<Tenant | null>(null);

export function TenantProvider({
  tenant,
  children,
}: {
  tenant: Tenant;
  children: ReactNode;
}) {
  return <TenantContext value={tenant}>{children}</TenantContext>;
}

export function useTenant(): Tenant {
  const tenant = useContext(TenantContext);
  if (!tenant) {
    throw new Error("useTenant must be used inside <TenantProvider>");
  }
  return tenant;
}

export function useFeature(feature: Feature): boolean {
  return hasFeature(useTenant().businessType, feature);
}
