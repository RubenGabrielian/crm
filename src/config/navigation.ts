import {
  ClipboardList,
  CreditCard,
  GraduationCap,
  House,
  Package,
  Receipt,
  ShoppingBag,
  Sprout,
  UserCog,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import {
  hasFeature,
  type BusinessType,
  type Feature,
} from "@/lib/tenant/features";
import { canOpenPath, type Access } from "@/lib/tenant/permissions";

type PerType<T> = T | Record<BusinessType, T>;

type NavConfigItem = {
  href: string;
  label: PerType<string>;
  icon: PerType<LucideIcon>;
  /** Item is hidden unless the tenant's business type has this feature. */
  requires?: Feature;
  /** Show the number of new orders next to this item. */
  showsNewOrders?: boolean;
};

export type NavItem = {
  href: string;
  label: string;
  /** The built-in name, shown as a hint when renaming. */
  defaultLabel: string;
  icon: LucideIcon;
  showsNewOrders: boolean;
};

const NAVIGATION: NavConfigItem[] = [
  { href: "/dashboard", label: "Գլխավոր", icon: House },
  {
    href: "/catalog",
    label: { ecommerce: "Ապրանքներ", service: "Դասընթացներ", mixed: "Կատալոգ" },
    icon: { ecommerce: Package, service: GraduationCap, mixed: Package },
  },
  {
    href: "/orders",
    label: { ecommerce: "Պատվերներ", service: "Գրանցումներ", mixed: "Պատվերներ" },
    icon: { ecommerce: ShoppingBag, service: ClipboardList, mixed: ShoppingBag },
    showsNewOrders: true,
  },
  { href: "/inventory", label: "Պահեստ", icon: Warehouse, requires: "inventory" },
  { href: "/customers", label: "CRM", icon: Users },
  { href: "/expenses", label: "Ծախսեր", icon: Receipt },
  { href: "/reinvestments", label: "Վերաներդրում", icon: Sprout },
  { href: "/employees", label: "Աշխատակիցներ", icon: UserCog },
  { href: "/billing", label: "Բաժանորդագրություն", icon: CreditCard },
];

function isPerType<T>(value: PerType<T>): value is Record<BusinessType, T> {
  return typeof value === "object" && value !== null && "ecommerce" in value;
}

function resolve<T>(value: PerType<T>, type: BusinessType): T {
  return isPerType(value) ? value[type] : value;
}

/** Every menu item's path; custom names are saved per path. */
export const NAV_HREFS = NAVIGATION.map((item) => item.href);

/** Longest name a user can give a menu item. */
export const NAV_LABEL_MAX = 30;

/** The user's own names for menu items, by path (e.g. "/orders" → "Իմ պատվերները"). */
export type NavLabels = Record<string, string>;

/**
 * Menu for this business type, with the user's own names where they set one.
 * An employee sees only the pages they were given.
 */
export function getNavigation(
  type: BusinessType,
  labels: NavLabels = {},
  access: Access = { role: "owner" },
): NavItem[] {
  return NAVIGATION.filter(
    (item) =>
      (!item.requires || hasFeature(type, item.requires)) &&
      canOpenPath(access, item.href),
  ).map((item) => ({
    href: item.href,
    label: labels[item.href] || resolve(item.label, type),
    defaultLabel: resolve(item.label, type),
    icon: resolve(item.icon, type),
    showsNewOrders: item.showsNewOrders ?? false,
  }));
}

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
