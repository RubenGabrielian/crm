import {
  ClipboardList,
  GraduationCap,
  House,
  Package,
  Receipt,
  ShoppingBag,
  Sprout,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import {
  hasFeature,
  type BusinessType,
  type Feature,
} from "@/lib/tenant/features";

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
  icon: LucideIcon;
  showsNewOrders: boolean;
};

const NAVIGATION: NavConfigItem[] = [
  { href: "/dashboard", label: "Գլխավոր", icon: House },
  {
    href: "/catalog",
    label: { ecommerce: "Ապրանքներ", service: "Դասընթացներ" },
    icon: { ecommerce: Package, service: GraduationCap },
  },
  {
    href: "/orders",
    label: { ecommerce: "Պատվերներ", service: "Գրանցումներ" },
    icon: { ecommerce: ShoppingBag, service: ClipboardList },
    showsNewOrders: true,
  },
  { href: "/inventory", label: "Պահեստ", icon: Warehouse, requires: "inventory" },
  { href: "/customers", label: "CRM", icon: Users },
  { href: "/expenses", label: "Ծախսեր", icon: Receipt },
  { href: "/reinvestments", label: "Վերաներդրում", icon: Sprout },
];

function isPerType<T>(value: PerType<T>): value is Record<BusinessType, T> {
  return typeof value === "object" && value !== null && "ecommerce" in value;
}

function resolve<T>(value: PerType<T>, type: BusinessType): T {
  return isPerType(value) ? value[type] : value;
}

export function getNavigation(type: BusinessType): NavItem[] {
  return NAVIGATION.filter(
    (item) => !item.requires || hasFeature(type, item.requires),
  ).map((item) => ({
    href: item.href,
    label: resolve(item.label, type),
    icon: resolve(item.icon, type),
    showsNewOrders: item.showsNewOrders ?? false,
  }));
}

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
