import { Check } from "lucide-react";
import { cn } from "cn";

/** "1 Տվյալներ — 2 Կոդ — 3 Բիզնես", with finished steps ticked. */
export function StepIndicator({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <ol
      aria-label="Քայլեր"
      className="flex flex-wrap items-center gap-2 text-xs"
    >
      {steps.map((step, index) => {
        const number = index + 1;
        const done = number < current;
        const active = number === current;
        return (
          <li
            key={step}
            aria-current={active ? "step" : undefined}
            className="flex items-center gap-2"
          >
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums",
                done && "bg-emerald-500 text-white",
                active && "bg-primary text-primary-foreground",
                !done &&
                  !active &&
                  "bg-card text-muted-foreground ring-1 ring-border",
              )}
            >
              {done ? (
                <Check className="size-3.5" strokeWidth={3} aria-hidden />
              ) : (
                number
              )}
            </span>
            <span
              className={cn(
                active
                  ? "font-medium text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {step}
            </span>
            {number < steps.length && (
              <span aria-hidden className="h-px w-5 bg-border" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
