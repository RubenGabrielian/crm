"use client";

import { createContext, useContext, type ReactNode } from "react";
import { hasFeature, type Feature, type Tenant } from "./features";
import { can, type Access, type Permission } from "./permissions";

const TenantContext = createContext<Tenant | null>(null);

const AccessContext = createContext<Access>({ role: "owner" });

export function TenantProvider({
  tenant,
  access,
  children,
}: {
  tenant: Tenant;
  access: Access;
  children: ReactNode;
}) {
  return (
    <TenantContext value={tenant}>
      <AccessContext value={access}>{children}</AccessContext>
    </TenantContext>
  );
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

/** What the signed-in person may see and do (owner or employee). */
export function useAccess(): Access {
  return useContext(AccessContext);
}

export function useCan(permission: Permission): boolean {
  return can(useAccess(), permission);
}
