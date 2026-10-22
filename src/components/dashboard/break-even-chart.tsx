import Link from "next/link";
import { Flag } from "lucide-react";
import { cn } from "cn";
import { formatMoney, formatNumber } from "@/lib/format";

type BreakEven = {
  date: string | null;
  pricePerUnit: number | null;
  variableCostPerUnit: number | null;
  contributionPerUnit: number | null;
  unitsNeeded: number | null;
  salesNeeded: number | null;
  remaining: number;
};

function shortDate(date: string) {
  const [, month, day] = date.split("-");
  return `${day}.${month}`;
}

/**
 * Break-even point as a road to a flag: how many units are sold, how many
 * are still missing to cover the period's costs, and what comes after.
 *
 *   units to break even = fixed costs ÷ (price − variable cost) per unit
 */
export function BreakEvenChart({
  breakEven,
  fixedCosts,
  contribution,
  unitsSold,
  unitLabel,
}: {
  breakEven: BreakEven;
  fixedCosts: number;
  contribution: number;
  unitsSold: number;
  /** "հատ" or "գրանցում". */
  unitLabel: string;
}) {
  const price = breakEven.pricePerUnit;
  const variable = breakEven.variableCostPerUnit;
  const perUnit = breakEven.contributionPerUnit;

  // States where there is nothing to show: say why and what to do.
  if (fixedCosts <= 0) {
    return (
      <Note>
        Այս ժամանակահատվածում ֆիքսված ծախս չկա, ուստի ամեն վաճառք արդեն
        շահույթ է։ Գրանցեք վարձը, աշխատավարձը և գովազդը{" "}
        <Link
          href="/expenses"
          className="font-medium text-foreground underline underline-offset-2"
        >
          «Ծախսեր»
        </Link>{" "}
        բաժնում որպես «Ֆիքսված»՝ զրոյական կետը տեսնելու համար։
      </Note>
    );
  }
  if (price === null || variable === null || perUnit === null) {
    return (
      <Note>
        Ֆիքսված ծախսեր՝ {formatMoney(fixedCosts)}։ Զրոյական կետը կհաշվվի
        առաջին վաճառքից հետո։
      </Note>
    );
  }
  if (perUnit <= 0) {
    return (
      <Note>
        Մեկ {unitLabel}ի միջին գինը ({formatMoney(Math.round(price))}) չի
        ծածկում դրա ինքնարժեքը ({formatMoney(Math.round(variable))}), ուստի
        այս գներով զրոյի հասնել հնարավոր չէ։ Բարձրացրեք գինը կամ իջեցրեք
        ինքնարժեքը։
      </Note>
    );
  }

  const goal = breakEven.unitsNeeded ?? 0;
  const reached = contribution >= fixedCosts;
  const unitsLeft = reached ? 0 : Math.ceil(breakEven.remaining / perUnit);
  const extra = Math.max(unitsSold - goal, 0);

  // The road: up to the flag, plus room after it for the profit part.
  const length = Math.max(goal, unitsSold) * (reached ? 1.08 : 1);
  const percent = (units: number) => Math.min((units / length) * 100, 100);
  const soldPercent = percent(unitsSold);
  const goalPercent = percent(goal);

  return (
    <div className="flex flex-col gap-6">
      {/* The answer in one sentence. */}
      <p className="text-lg leading-snug font-semibold text-balance sm:text-xl">
        {reached ? (
          <>
            Զրոյին հասաք
            {breakEven.date ? ` ${shortDate(breakEven.date)}-ին` : ""}։ Դրանից
            հետո վաճառված {formatNumber(extra)} {unitLabel}ը բերել է{" "}
            <span className="text-emerald-700">
              {formatMoney(Math.round(contribution - fixedCosts))} շահույթ
            </span>
            ։
          </>
        ) : (
          <>
            Վաճառել եք {formatNumber(unitsSold)} {unitLabel}։ Եվս{" "}
            <span className="text-[#185aef]">
              {formatNumber(unitsLeft)} {unitLabel}
            </span>
            , և կծածկեք բոլոր ծախսերը։
          </>
        )}
      </p>

      {/* The road to the flag */}
      <div className="px-4 pt-9 pb-8">
        <div
          aria-hidden
          className="relative h-4 rounded-full bg-[repeating-linear-gradient(-45deg,var(--muted),var(--muted)_6px,transparent_6px,transparent_12px)] ring-1 ring-border ring-inset"
        >
          {/* Sold up to the flag: covering costs */}
          <div
            className="source-bar absolute inset-y-0 left-0 rounded-full bg-[#185aef]"
            style={{ width: `${Math.min(soldPercent, goalPercent)}%` }}
          />
          {/* Sold after the flag: profit */}
          {reached && extra > 0 && (
            <div
              className="absolute inset-y-0 rounded-r-full bg-emerald-500"
              style={{
                left: `${goalPercent}%`,
                width: `${soldPercent - goalPercent}%`,
              }}
            />
          )}

          {/* You are here */}
          <span
            className={cn(
              "absolute -top-9 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-white",
              reached ? "bg-emerald-600" : "bg-[#185aef]",
              soldPercent < 15
                ? "translate-x-0"
                : soldPercent > 85
                  ? "-translate-x-full"
                  : "-translate-x-1/2",
            )}
            style={{ left: `${soldPercent}%` }}
          >
            Դուք՝ {formatNumber(unitsSold)}
          </span>

          {/* The flag: break-even */}
          <span
            className="absolute top-1/2 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-card text-foreground shadow-soft ring-2 ring-foreground"
            style={{ left: `${goalPercent}%` }}
          >
            <Flag className="size-4" strokeWidth={2.25} />
          </span>
          <span
            className={cn(
              "absolute top-8 text-xs font-semibold whitespace-nowrap",
              goalPercent > 85 ? "-translate-x-full" : "-translate-x-1/2",
            )}
            style={{ left: `${goalPercent}%` }}
          >
            Զրոյական կետ՝ {formatNumber(goal)}
          </span>
          <span className="absolute top-8 left-0 text-xs text-muted-foreground">
            0
          </span>
        </div>
      </div>

      {/* Three plain numbers */}
      <dl className="grid grid-cols-3 gap-2 sm:gap-3">
        <Stat label="Վաճառված" value={unitsSold} unit={unitLabel} />
        {reached ? (
          <Stat label="Շահույթով" value={extra} unit={unitLabel} tone="good" />
        ) : (
          <Stat label="Մնաց" value={unitsLeft} unit={unitLabel} tone="accent" />
        )}
        <Stat label="Զրոյական կետ" value={goal} unit={unitLabel} />
      </dl>

      {/* The formula, for those who want it */}
      <details className="rounded-lg bg-muted px-4 py-3 text-sm">
        <summary className="cursor-pointer font-medium outline-none marker:text-muted-foreground focus-visible:underline">
          Ինչպես է հաշվվում
        </summary>
        <p className="mt-2 text-muted-foreground tabular-nums">
          {formatMoney(Math.round(fixedCosts))} ֆիքսված ծախս ÷ (
          {formatMoney(Math.round(price))} միջին գին −{" "}
          {formatMoney(Math.round(variable))} ինքնարժեք) ={" "}
          <span className="font-semibold text-foreground">
            {formatNumber(goal)} {unitLabel}
          </span>
          {breakEven.salesNeeded !== null && (
            <>, այսինքն՝ {formatMoney(Math.round(breakEven.salesNeeded))} վաճառք</>
          )}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Ֆիքսված են այն ծախսերը, որոնք «Ծախսեր» բաժնում նշել եք «Ֆիքսված»
          (վարձ, աշխատավարձ, գովազդ)։ Ինքնարժեքը ապրանքի գինն ու նյութերն են։
          Թվերը վերցված են ընտրված ժամանակահատվածից։
        </p>
      </details>
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: number;
  unit: string;
  tone?: "accent" | "good";
}) {
  return (
    <div className="rounded-lg bg-muted px-3 py-2.5 sm:px-4">
      <dt className="text-xs leading-tight text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "mt-0.5 text-xl font-semibold tabular-nums",
          tone === "accent" && "text-[#185aef]",
          tone === "good" && "text-emerald-700",
        )}
      >
        {formatNumber(value)}
        <span className="ml-1 text-xs font-normal text-muted-foreground">
          {unit}
        </span>
      </dd>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg bg-muted px-4 py-3 text-sm leading-relaxed text-muted-foreground">
      {children}
    </p>
  );
}
