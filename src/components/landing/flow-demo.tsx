"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell,
  CreditCard,
  Link2,
  Mail,
  PackageMinus,
  ShoppingBag,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";

type Step = {
  icon: LucideIcon;
  module: string;
  title: string;
  text: string;
  /** The line of the order card this step lights up. */
  line: number;
};

// One illustrative order, followed from the link to the dashboard.
const LINES = [
  "10:24 · Instagram DM · հղումով",
  "Զեղչ 10% · −1 580 ֏",
  "Առաքում · 1 000 ֏",
  "Պահեստ · −2 խաղալիք, −2 տոպրակ",
  "Կարգավիճակ · Առաքված · նամակ ուղարկված",
  "Վճարում · Քարտով · Վճարված",
  "Վահանակում · +7 520 ֏ շահույթ",
];

const STEPS: Step[] = [
  {
    icon: Link2,
    module: "Պատվեր հղումով",
    title: "Պատճենում եք ապրանքի հղումը",
    text: "10% զեղչով և ձեր առաքման գնով։ Հաճախորդը չի կարող փոխել այդ թվերը։",
    line: 1,
  },
  {
    icon: ShoppingBag,
    module: "Պատվերներ",
    title: "Հաճախորդը պատվիրում է ինքը",
    text: "Անուն, հեռախոս, հասցե, քանակ. առանց DM-ում հարց ու պատասխանի։",
    line: 0,
  },
  {
    icon: Bell,
    module: "Ծանուցումներ",
    title: "Տեսնում եք նոր պատվերը",
    text: "Կողային մենյուում հայտնվում է նոր պատվերների նշանը։",
    line: 2,
  },
  {
    icon: PackageMinus,
    module: "Պահեստ և նյութեր",
    title: "Պահեստը նվազում է ինքը",
    text: "2 խաղալիք և ապրանքի կարգավորման համաձայն՝ 2 տոպրակ։",
    line: 3,
  },
  {
    icon: Mail,
    module: "Կարգավիճակներ",
    title: "Փոխում եք կարգավիճակը",
    text: "«Առաքված» ընտրելիս հաճախորդը ստանում է նամակ հայերենով։",
    line: 4,
  },
  {
    icon: CreditCard,
    module: "Վճարումներ",
    title: "Նշում եք վճարումը",
    text: "Կանխիկ, քարտով, փոխանցում կամ POS. վճարվա՞ծ է, թե՞ ոչ։",
    line: 5,
  },
  {
    icon: TrendingUp,
    module: "Վահանակ",
    title: "Շահույթը հաշվված է",
    text: "Վաճառքից հանվում են ինքնարժեքն ու նյութերը, հետո՝ մարքեթինգը։",
    line: 6,
  },
];

const STEP_MS = 2600;

export function FlowDemo() {
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const [paused, setPaused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      {
        threshold: 0.35,
      },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(
      () => setActive((current) => (current + 1) % STEPS.length),
      STEP_MS,
    );
    return () => window.clearInterval(id);
  }, [inView, paused]);

  const litLine = STEPS[active].line;

  return (
    <div
      ref={ref}
      className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* The order record */}
      <div className="self-start rounded-3xl bg-card p-5 shadow-soft lg:sticky lg:top-24">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-900">
            Ա
          </span>
          <div>
            <p className="font-semibold">Անի Մ.</p>
            <p className="text-sm text-muted-foreground">
              Փոքր Արարատ 45սմ × 2
            </p>
          </div>
          <span className="ml-auto text-lg font-semibold tabular-nums">
            15 220 ֏
          </span>
        </div>
        <ul className="mt-5 flex flex-col gap-1.5">
          {LINES.map((line, index) => (
            <li
              key={line}
              className={cn(
                "rounded-xl px-3 py-2.5 text-sm transition-all duration-500",
                index === litLine
                  ? "bg-apricot/50 font-medium text-foreground"
                  : "bg-muted/60 text-muted-foreground",
              )}
            >
              {line}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          Օրինակ՝ մտացածին պատվեր։
        </p>
      </div>

      {/* The steps, joined by one line */}
      <ol className="relative rounded-3xl bg-card p-3 shadow-soft">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === active;
          const done = index < active;
          return (
            <li key={step.title} className="relative">
              {index < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-11 -bottom-1 left-[1.75rem] w-px transition-colors duration-500",
                    done ? "bg-ring" : "bg-foreground/10",
                  )}
                />
              )}
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-current={isActive ? "step" : undefined}
                className={cn(
                  "relative flex w-full gap-4 rounded-2xl p-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                  isActive ? "bg-muted" : "hover:bg-muted/50",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums transition-colors duration-500",
                    isActive || done
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-2 py-0.5 text-xs font-medium text-violet-700 shadow-soft">
                    <Icon className="size-3.5" aria-hidden />
                    {step.module}
                  </span>
                  <span className="mt-1.5 block font-semibold">
                    {step.title}
                  </span>
                  <span
                    className={cn(
                      "grid text-sm text-muted-foreground transition-all duration-500",
                      isActive
                        ? "mt-1 grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0",
                    )}
                  >
                    <span className="overflow-hidden">{step.text}</span>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
