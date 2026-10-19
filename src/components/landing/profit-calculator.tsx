"use client";

import { useId, useState } from "react";
import { cn } from "cn";
import { formatMoney, formatNumber } from "@/lib/format";

type Inputs = {
  units: number;
  price: number;
  cost: number;
  materials: number;
  marketing: number;
};

const SLIDERS: {
  key: keyof Inputs;
  label: string;
  min: number;
  max: number;
  step: number;
  money: boolean;
}[] = [
  {
    key: "units",
    label: "Վաճառված հատ ամսական",
    min: 10,
    max: 600,
    step: 5,
    money: false,
  },
  {
    key: "price",
    label: "Միջին գին",
    min: 1000,
    max: 60000,
    step: 500,
    money: true,
  },
  {
    key: "cost",
    label: "Ինքնարժեք 1 հատի",
    min: 0,
    max: 40000,
    step: 100,
    money: true,
  },
  {
    key: "materials",
    label: "Փաթեթ, պիտակ, լցոն 1 հատի",
    min: 0,
    max: 3000,
    step: 50,
    money: true,
  },
  {
    key: "marketing",
    label: "Մարքեթինգ ամսական",
    min: 0,
    max: 500000,
    step: 5000,
    money: true,
  },
];

const DAYS = 30;

/**
 * The same formula as the dashboard, in miniature:
 * net profit = sales − cost − materials − marketing,
 * and the day of the month on which sales have paid for marketing.
 */
export function ProfitCalculator() {
  const id = useId();
  const [inputs, setInputs] = useState<Inputs>({
    units: 120,
    price: 9900,
    cost: 3400,
    materials: 200,
    marketing: 80000,
  });

  const sales = inputs.units * inputs.price;
  const variable = inputs.units * (inputs.cost + inputs.materials);
  const contribution = sales - variable;
  const net = contribution - inputs.marketing;
  const perUnit = inputs.price - inputs.cost - inputs.materials;
  const unitsToZero =
    perUnit > 0 ? Math.ceil(inputs.marketing / perUnit) : null;
  const dailyContribution = contribution / DAYS;
  const zeroDay =
    inputs.marketing === 0
      ? 1
      : dailyContribution > 0
        ? Math.ceil(inputs.marketing / dailyContribution)
        : null;
  const reaches = zeroDay !== null && zeroDay <= DAYS;
  const parts = [
    {
      label: "Ինքնարժեք",
      value: inputs.units * inputs.cost,
      tone: "bg-[#c9dafd]",
    },
    {
      label: "Նյութեր",
      value: inputs.units * inputs.materials,
      tone: "bg-[#ffd9c2]",
    },
    { label: "Մարքեթինգ", value: inputs.marketing, tone: "bg-[#bfe6ff]" },
    { label: "Մաքուր շահույթ", value: Math.max(net, 0), tone: "bg-[#185aef]" },
  ];
  const whole = Math.max(sales, variable + inputs.marketing, 1);

  return (
    <div className="grid overflow-hidden rounded-[2rem] border bg-card shadow-soft lg:grid-cols-[1fr_1.1fr]">
      <form
        className="flex flex-col gap-5 p-6 sm:p-8"
        onSubmit={(event) => event.preventDefault()}
        aria-label="Ձեր թվերը"
      >
        {SLIDERS.map((slider) => {
          const value = inputs[slider.key];
          return (
            <div key={slider.key}>
              <div className="flex items-baseline justify-between gap-3">
                <label
                  htmlFor={`${id}-${slider.key}`}
                  className="text-sm text-muted-foreground"
                >
                  {slider.label}
                </label>
                <output
                  htmlFor={`${id}-${slider.key}`}
                  className="text-sm font-semibold tabular-nums"
                >
                  {slider.money ? formatMoney(value) : formatNumber(value)}
                </output>
              </div>
              <input
                id={`${id}-${slider.key}`}
                type="range"
                min={slider.min}
                max={slider.max}
                step={slider.step}
                value={value}
                onChange={(event) => {
                  // Read now: the event is gone by the time the updater runs.
                  const next = Number(event.currentTarget.value);
                  setInputs((current) => ({ ...current, [slider.key]: next }));
                }}
                className="calc-range mt-2 w-full"
                style={{
                  backgroundSize: `${((value - slider.min) / (slider.max - slider.min)) * 100}% 100%`,
                }}
              />
            </div>
          );
        })}
      </form>

      <div
        className="flex flex-col gap-5 bg-[#f0f5ff] p-6 sm:p-8"
        aria-live="polite"
      >
        <div>
          <p className="text-sm text-muted-foreground">
            Մաքուր շահույթ ամսական
          </p>
          <p
            className={cn(
              "mt-1 text-5xl font-semibold tracking-tight tabular-nums",
              net < 0 && "text-destructive",
            )}
          >
            {formatMoney(net)}
          </p>
        </div>

        {/* Where each dram of sales goes */}
        <div>
          <div className="flex h-4 overflow-hidden rounded-full bg-white">
            {parts.map((part) => (
              <span
                key={part.label}
                className={cn(
                  "h-full transition-[width] duration-500",
                  part.tone,
                )}
                style={{ width: `${(part.value / whole) * 100}%` }}
              />
            ))}
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
            {parts.map((part) => (
              <li key={part.label} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={cn("size-2.5 shrink-0 rounded-full", part.tone)}
                />
                <span className="text-muted-foreground">{part.label}</span>
                <span className="ml-auto font-medium tabular-nums">
                  {formatMoney(part.value)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-white p-4">
            <dt className="text-muted-foreground">Վաճառք</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums">
              {formatMoney(sales)}
            </dd>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <dt className="text-muted-foreground">Զրոյական կետ</dt>
            <dd className="mt-1 text-lg font-semibold">
              {reaches ? `${zeroDay}-րդ օրը` : "Չի հասնում"}
            </dd>
            <dd className="text-xs text-muted-foreground">
              {unitsToZero === null
                ? "Գինը չի ծածկում ինքնարժեքը"
                : `${formatNumber(unitsToZero)} հատից հետո`}
            </dd>
          </div>
        </dl>
        <p className="text-xs text-muted-foreground">
          Հաշվիչը նույն բանաձևով է, ինչ վահանակը, բայց վահանակում թվերը հաշվվում
          են ձեր իրական պատվերներից և ծախսերից։
        </p>
      </div>
    </div>
  );
}
