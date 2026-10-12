import Link from "next/link";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  RANGE_LABELS,
  RANGE_PRESETS,
  type DateRange,
} from "@/lib/analytics/range";

/** Plain links and a GET form, so the chosen period lives in the URL. */
export function RangeFilter({
  range,
  today,
  path = "/dashboard",
}: {
  range: DateRange;
  today: string;
  /** Page the filter belongs to. */
  path?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
      <nav aria-label="Ժամանակահատված" className="flex rounded-lg bg-muted p-0.5 text-sm font-medium">
        {RANGE_PRESETS.map((preset) => (
          <Link
            key={preset}
            href={`${path}?range=${preset}`}
            aria-current={range.key === preset ? "true" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 whitespace-nowrap text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
              range.key === preset && "bg-card text-foreground shadow-sm",
            )}
          >
            {RANGE_LABELS[preset]}
          </Link>
        ))}
      </nav>

      <form action={path} className="flex flex-wrap items-center gap-2 text-sm">
        <input type="hidden" name="range" value="custom" />
        <label htmlFor="range-from" className="sr-only">
          Սկիզբ
        </label>
        <Input
          id="range-from"
          name="from"
          type="date"
          required
          max={today}
          defaultValue={range.from}
          className={cn("w-36", range.key === "custom" && "border-ring")}
        />
        <span aria-hidden className="text-muted-foreground">
          –
        </span>
        <label htmlFor="range-to" className="sr-only">
          Ավարտ
        </label>
        <Input
          id="range-to"
          name="to"
          type="date"
          required
          max={today}
          defaultValue={range.to}
          className={cn("w-36", range.key === "custom" && "border-ring")}
        />
        <Button type="submit" variant="outline">
          Կիրառել
        </Button>
      </form>
    </div>
  );
}
