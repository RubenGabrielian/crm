"use client";

import { useTransition } from "react";
import { Package } from "lucide-react";
import { useNavigate } from "@/components/layout/navigation-progress";
import { FilterMenu, SearchingNote } from "@/components/orders/order-filters";

/** Shows only the customers who ordered the chosen product (?product=…). */
export function CustomerProductFilter({
  value,
  products,
  itemLabel,
  allItemsLabel,
  keep,
}: {
  value: string;
  products: { id: string; title: string }[];
  /** "Product" / "Course". */
  itemLabel: string;
  /** "All products" / "All courses". */
  allItemsLabel: string;
  /** Other params to keep (sort, search). */
  keep: Record<string, string | undefined>;
}) {
  const navigate = useNavigate();
  const [pending, startTransition] = useTransition();

  function change(product: string) {
    const params = new URLSearchParams();
    for (const [key, item] of Object.entries(keep)) if (item) params.set(key, item);
    if (product) params.set("product", product);
    const text = params.toString();
    startTransition(() => navigate(text ? `/customers?${text}` : "/customers"));
  }

  return (
    <div aria-busy={pending} className="flex items-center gap-1">
      <FilterMenu
        icon={Package}
        name={itemLabel}
        allLabel={allItemsLabel}
        options={products.map((product) => ({ value: product.id, label: product.title }))}
        value={value}
        onChange={change}
        loading={pending}
      />
      {pending && <SearchingNote />}
    </div>
  );
}
