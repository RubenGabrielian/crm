/**
 * What an employee may see and do. The owner always has everything; an
 * employee has only the permissions the owner ticked for them.
 */
export const PAGE_PERMISSIONS = [
  "dashboard",
  "catalog",
  "orders",
  "inventory",
  "customers",
  "expenses",
  "reinvestments",
] as const;

export type PagePermission = (typeof PAGE_PERMISSIONS)[number];
/**
 * Beyond pages: "catalog_edit" adds, edits and deletes catalog items;
 * "cost_view" shows cost prices (products' and materials' unit cost).
 */
export type Permission = PagePermission | "catalog_edit" | "cost_view";

export const PERMISSIONS: readonly Permission[] = [
  ...PAGE_PERMISSIONS,
  "catalog_edit",
  "cost_view",
];

/** Product metadata keys hidden from people without "cost_view". */
export const COST_FIELDS = ["unit_cost"];

/** Pages that show the money: income, profit, expenses, reinvestments. */
export const MONEY_PAGES: readonly PagePermission[] = ["dashboard", "expenses", "reinvestments"];

export function isPermission(value: unknown): value is Permission {
  return PERMISSIONS.includes(value as Permission);
}

export function isPagePermission(value: unknown): value is PagePermission {
  return PAGE_PERMISSIONS.includes(value as PagePermission);
}

/** Menu path → the permission needed to open it. Owner-only paths are missing. */
export const PATH_PERMISSIONS: Record<string, PagePermission> = Object.fromEntries(
  PAGE_PERMISSIONS.map((page) => [`/${page}`, page]),
);

/** Paths only the owner sees. */
export const OWNER_ONLY_PATHS = ["/employees", "/billing"];

/**
 * Paths every employee opens. The home page always works: with "dashboard"
 * it shows the money overview, without it a work overview (orders, stock).
 */
export const ALWAYS_OPEN_PATHS = ["/dashboard"];

export type Access =
  | { role: "owner" }
  | { role: "employee"; name: string; permissions: Permission[] };

export function can(access: Access, permission: Permission): boolean {
  return access.role === "owner" || access.permissions.includes(permission);
}

export function canAny(access: Access, permissions: readonly Permission[]): boolean {
  return permissions.some((permission) => can(access, permission));
}

/** Whether this person may open a menu path. */
export function canOpenPath(access: Access, href: string): boolean {
  if (access.role === "owner") return true;
  if (OWNER_ONLY_PATHS.includes(href)) return false;
  if (ALWAYS_OPEN_PATHS.includes(href)) return true;
  const permission = PATH_PERMISSIONS[href];
  return permission ? can(access, permission) : true;
}

/** Where someone is sent from a page they may not open: the home page, open to all. */
export function homePath(): string {
  return "/dashboard";
}

/** Keeps only known permissions, once each. */
export function cleanPermissions(values: unknown[]): Permission[] {
  return PERMISSIONS.filter((permission) => values.includes(permission));
}
