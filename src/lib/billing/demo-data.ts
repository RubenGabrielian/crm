import "server-only";

import type { Analytics } from "@/lib/analytics/queries";
import { daysBetween, type DateRange } from "@/lib/analytics/range";
import type { Customer } from "@/lib/customers/queries";
import type { InventoryRow } from "@/lib/inventory/queries";
import type { Material } from "@/lib/materials/queries";
import type { Reinvestment } from "@/lib/reinvestments/queries";
import type { BusinessType } from "@/lib/tenant/features";

/*
 * Made-up numbers that free accounts see on Pro pages, so they can tell what
 * they would pay for. Nothing here is read from the database.
 */

const UNIT_PRICE = 12_500;
const UNIT_COST = 4_500;
const UNIT_MATERIALS = 700;

function demoTitles(type: BusinessType): string[] {
  return type === "service"
    ? ["Անգլերեն A1", "Գրաֆիկ դիզայն", "Լուսանկարչություն", "Python սկսնակների համար"]
    : ["Ձեռագործ մոմ", "Կավե բաժակ", "Մետաքսե շարֆ", "Արծաթե ականջօղեր"];
}

const split = (total: number, shares: number[]) =>
  shares.map((share) => Math.round(total * share));

export function demoAnalytics(range: DateRange, type: BusinessType): Analytics {
  const daily = daysBetween(range.from, range.to).map((date, index) => {
    const orders = 2 + ((index * 7 + 3) % 4);
    const units = orders + (index % 2);
    return { date, orders, units, revenue: units * UNIT_PRICE };
  });
  const totalOrders = daily.reduce((sum, day) => sum + day.orders, 0);
  const unitsSold = daily.reduce((sum, day) => sum + day.units, 0);
  const sales = unitsSold * UNIT_PRICE;
  const grossSales = Math.round(sales * 1.05);
  const cogs = unitsSold * UNIT_COST;
  const materialsCost = unitsSold * UNIT_MATERIALS;
  const variableCosts = cogs + materialsCost;
  const contribution = sales - variableCosts;
  const marketingSpend = Math.round(sales * 0.12);
  const otherExpenses = Math.round(sales * 0.08);
  const netProfit = contribution - marketingSpend;
  const fixedCosts = marketingSpend + otherExpenses;
  const contributionPerUnit = UNIT_PRICE - UNIT_COST - UNIT_MATERIALS;

  // First day whose running contribution covers the period's fixed costs.
  let running = 0;
  const breakEvenDay = daily.find((day) => {
    running += day.units * contributionPerUnit;
    return running >= fixedCosts;
  });

  const titles = demoTitles(type);
  const productUnits = split(unitsSold, [0.4, 0.3, 0.2, 0.1]);
  const [instagram, facebook, tiktok, unknown] = split(totalOrders, [0.6, 0.2, 0.15, 0.05]);
  const [newOrders, confirmed] = split(totalOrders, [0.15, 0.25]);
  const [ads, influencer] = split(marketingSpend, [0.6, 0.4]);
  const averageOrder = sales / totalOrders;

  return {
    totalOrders,
    deliveredOrders: totalOrders - newOrders - confirmed,
    unitsSold,
    grossSales,
    discounts: grossSales - sales,
    sales,
    deliveryCollected: type === "service" ? 0 : totalOrders * 1_000,
    averageOrder,
    cogs,
    grossProfit: sales - cogs,
    materialsCost,
    variableCosts,
    contribution,
    contributionMargin: (contribution / sales) * 100,
    marketingSpend,
    otherExpenses,
    netProfit,
    remainingAfterExpenses: netProfit - otherExpenses,
    fixedCosts,
    breakEven: {
      date: breakEvenDay?.date ?? null,
      pricePerUnit: UNIT_PRICE,
      variableCostPerUnit: UNIT_COST + UNIT_MATERIALS,
      contributionPerUnit,
      unitsNeeded: Math.ceil(fixedCosts / contributionPerUnit),
      salesNeeded: fixedCosts / (1 - variableCosts / sales),
      remaining: Math.max(0, fixedCosts - contribution),
      progress: Math.min(1, contribution / fixedCosts),
    },
    cac: marketingSpend / totalOrders,
    roas: sales / marketingSpend,
    profitMargin: (netProfit / sales) * 100,
    daily: daily.map(({ date, revenue, orders }) => ({ date, revenue, orders })),
    products: titles.map((title, index) => ({
      title,
      units: productUnits[index],
      revenue: productUnits[index] * UNIT_PRICE,
      grossProfit: productUnits[index] * (UNIT_PRICE - UNIT_COST),
    })),
    sources: [
      { name: "Instagram", orders: instagram, revenue: Math.round(instagram * averageOrder) },
      { name: "Facebook", orders: facebook, revenue: Math.round(facebook * averageOrder) },
      { name: "TikTok", orders: tiktok, revenue: Math.round(tiktok * averageOrder) },
      { name: null, orders: unknown, revenue: Math.round(unknown * averageOrder) },
    ],
    marketingByCategory: [
      { category: "paid_ads", amount: ads },
      { category: "influencer", amount: influencer },
    ],
    statuses: {
      new: newOrders,
      confirmed,
      completed: totalOrders - newOrders - confirmed,
    },
  };
}

export function demoInventory(type: BusinessType): InventoryRow[] {
  const stock = [
    { received: 120, sold: 86, gifted: 4 },
    { received: 80, sold: 61, gifted: 2 },
    { received: 50, sold: 50, gifted: 0 },
    { received: 40, sold: 17, gifted: 1 },
  ];
  return demoTitles(type).map((title, index) => {
    const { received, sold, gifted } = stock[index];
    return {
      productId: `demo-${index + 1}`,
      title,
      imageUrl: null,
      received,
      sold,
      gifted,
      used: sold + gifted,
      available: received - sold - gifted,
    };
  });
}

export const DEMO_MATERIALS: Material[] = [
  { name: "Նվերի տուփ", unit: "հատ", unitCost: 350, available: 140, usedInSales: 210, usedInGifts: 7 },
  { name: "Ժապավեն", unit: "մ", unitCost: 120, available: 35, usedInSales: 160, usedInGifts: 5 },
  { name: "Այցեքարտ", unit: "հատ", unitCost: 40, available: 0, usedInSales: 300, usedInGifts: 10 },
].map((material, index) => ({
  ...material,
  id: `demo-material-${index + 1}`,
  imageUrl: null,
  received: material.available + material.usedInSales + material.usedInGifts,
}));

/** ISO time `days` days before now, so the demo always looks recent. */
function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

export function demoCustomers(): Customer[] {
  return [
    { name: "Անի Հակոբյան", phone: "+37491123456", orders: 7, spent: 98_500, ago: 1, address: "Երևան, Աբովյան 12" },
    { name: "Մարիամ Սարգսյան", phone: "+37477234567", orders: 5, spent: 71_000, ago: 2, address: "Երևան, Կոմիտաս 45" },
    { name: "Լիլիթ Գրիգորյան", phone: "+37493345678", orders: 4, spent: 52_500, ago: 4, address: "Գյումրի, Ռիժկովի 8" },
    { name: "Նարե Պետրոսյան", phone: "+37455456789", orders: 3, spent: 40_000, ago: 6, address: null },
    { name: "Արմեն Ավետիսյան", phone: "+37498567890", orders: 2, spent: 26_000, ago: 9, address: "Վանաձոր, Տիգրան Մեծի 3" },
    { name: "Սոնա Մկրտչյան", phone: "+37494678901", orders: 1, spent: 13_500, ago: 15, address: null },
  ].map((customer, index) => ({
    id: `demo-customer-${index + 1}`,
    name: customer.name,
    phone: customer.phone,
    email: null,
    comment: index === 0 ? "Մշտական հաճախորդ, սիրում է կարմիր գույնը" : null,
    lastAddress: customer.address,
    orderCount: customer.orders,
    totalSpent: customer.spent,
    lastOrderAt: daysAgo(customer.ago),
    productIds: [],
  }));
}

export function demoReinvestments(today: string, type: BusinessType): Reinvestment[] {
  const titles = demoTitles(type);
  const before = (days: number) =>
    new Date(Date.parse(today) - days * 86_400_000).toISOString().slice(0, 10);
  return [
    { purpose: "Նոր խմբաքանակ", productTitle: titles[0], amount: 180_000, status: "done" as const, date: before(20) },
    { purpose: "Լուսանկարահանում", productTitle: titles[1], amount: 60_000, status: "done" as const, date: before(12) },
    { purpose: "Instagram գովազդ", productTitle: null, amount: 45_000, status: "in_progress" as const, date: before(5) },
    { purpose: "Նոր փաթեթավորում", productTitle: null, amount: 90_000, status: "planned" as const, date: before(-7) },
  ].map((item, index) => ({ ...item, id: `demo-reinvestment-${index + 1}` }));
}
