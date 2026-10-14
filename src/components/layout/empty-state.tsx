import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Optional button under the text. */
  action?: ReactNode;
}) {
  return (
    <section className="flex flex-col items-center rounded-3xl bg-card px-6 py-16 text-center shadow-soft sm:px-10">
      <span className="flex size-14 items-center justify-center rounded-full bg-apricot text-primary">
        <Icon className="size-6" strokeWidth={1.75} aria-hidden />
      </span>
      <h2 className="mt-5 text-lg font-semibold">{title}</h2>
      <p className="mt-1.5 max-w-md text-sm text-balance text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </section>
  );
}
