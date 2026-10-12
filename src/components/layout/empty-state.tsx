import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-xl border bg-card px-6 py-14 shadow-soft sm:px-10">
      <Icon className="size-7 text-apricot" strokeWidth={1.75} aria-hidden />
      <h2 className="mt-4 text-base font-semibold">{title}</h2>
      <p className="mt-1 max-w-prose text-sm text-muted-foreground">{description}</p>
    </section>
  );
}
