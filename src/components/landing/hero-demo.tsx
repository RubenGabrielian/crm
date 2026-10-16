"use client";

import { useEffect, useState } from "react";
import { BellRing, Pause, Play, TrendingUp } from "lucide-react";
import { cn } from "cn";
import { formatMoney } from "@/lib/format";

type Status = "new" | "confirmed" | "completed";
type Row = { name: string; item: string; total: number; source: string };
type Industry = {
  key: string;
  label: string;
  caption: string;
  unit: "պատվեր" | "գրանցում";
  rows: Row[];
};

// Illustrative shops only; the names and numbers are made up for the demo.
const INDUSTRIES: Industry[] = [
  {
    key: "toys",
    label: "Խաղալիքներ",
    caption:
      "Խաղալիքների խանութ՝ պատվեր հղումով, պահեստ և տոպրակների դուրսգրում",
    unit: "պատվեր",
    rows: [
      {
        name: "Անի Մ.",
        item: "Փափուկ արջուկ × 2",
        total: 19800,
        source: "Instagram DM",
      },
      {
        name: "Գոռ Հ.",
        item: "Կավե կենդանիներ",
        total: 7400,
        source: "Meta Ads",
      },
      {
        name: "Լիլիթ Ա.",
        item: "Փափուկ արջուկ",
        total: 9900,
        source: "Instagram DM",
      },
      {
        name: "Մարիամ Ս.",
        item: "Խաղալիք-բարձ",
        total: 12500,
        source: "Հղում",
      },
    ],
  },
  {
    key: "clothes",
    label: "Հագուստ",
    caption: "Հագուստի խանութ՝ չափսեր, զեղչով հղումներ և վճարման կարգավիճակ",
    unit: "պատվեր",
    rows: [
      {
        name: "Նարե Կ.",
        item: "Բրդյա սվիտեր, M",
        total: 18500,
        source: "Instagram DM",
      },
      {
        name: "Արամ Պ.",
        item: "Կտավե շապիկ, L",
        total: 12000,
        source: "Meta Ads",
      },
      {
        name: "Սոնա Գ.",
        item: "Շարֆ, ձեռագործ",
        total: 8900,
        source: "Instagram DM",
      },
      {
        name: "Էլեն Վ.",
        item: "Բրդյա սվիտեր, S",
        total: 18500,
        source: "Հղում",
      },
    ],
  },
  {
    key: "sweets",
    label: "Քաղցրավենիք",
    caption: "Տնական քաղցրավենիք՝ պատվեր վաղվա համար, վճարումը՝ առաքելիս",
    unit: "պատվեր",
    rows: [
      {
        name: "Հասմիկ Դ.",
        item: "Մակարոնի տուփ × 2",
        total: 13000,
        source: "Instagram DM",
      },
      {
        name: "Տիգրան Ս.",
        item: "Տորթ «Միկադո»",
        total: 14000,
        source: "Instagram DM",
      },
      {
        name: "Ռուզաննա Լ.",
        item: "Թխվածքաբլիթ, 1 կգ",
        total: 6800,
        source: "Meta Ads",
      },
      { name: "Կարեն Ա.", item: "Մակարոնի տուփ", total: 6500, source: "Հղում" },
    ],
  },
  {
    key: "cosmetics",
    label: "Կոսմետիկա",
    caption:
      "Ձեռագործ կոսմետիկա՝ ինքնարժեք, փաթեթավորում և իրական շահույթ ըստ ապրանքի",
    unit: "պատվեր",
    rows: [
      {
        name: "Մելինե Թ.",
        item: "Ձեռքի կրեմ × 3",
        total: 14700,
        source: "Instagram DM",
      },
      {
        name: "Աննա Ռ.",
        item: "Օճառ, լավանդա",
        total: 2500,
        source: "Meta Ads",
      },
      {
        name: "Լուսինե Մ.",
        item: "Նվեր-հավաքածու",
        total: 11900,
        source: "Հղում",
      },
      {
        name: "Սյուզի Բ.",
        item: "Շրթներկ-բալզամ",
        total: 3200,
        source: "Instagram DM",
      },
    ],
  },
  {
    key: "handmade",
    label: "Ձեռագործ",
    caption: "Ձեռագործ իրեր՝ նյութերի ծախս ամեն վաճառքից և ամսական շահույթ",
    unit: "պատվեր",
    rows: [
      {
        name: "Գայանե Հ.",
        item: "Կերամիկական բաժակ × 2",
        total: 15000,
        source: "Instagram DM",
      },
      {
        name: "Դավիթ Մ.",
        item: "Մոմ, սոյայի",
        total: 5500,
        source: "Meta Ads",
      },
      {
        name: "Իննա Ս.",
        item: "Կերամիկական ափսե",
        total: 9800,
        source: "Instagram DM",
      },
      { name: "Արփի Կ.", item: "Մոմ × 3", total: 16500, source: "Հղում" },
    ],
  },
  {
    key: "courses",
    label: "Դասընթացներ",
    caption: "Դասընթացներ՝ գրանցում հղումով, խմբեր և ամսական ֆիքսված ծախսեր",
    unit: "գրանցում",
    rows: [
      {
        name: "Մանե Գ.",
        item: "Անգլերեն A2",
        total: 35000,
        source: "Instagram DM",
      },
      {
        name: "Հայկ Ն.",
        item: "Ծրագրավորում, սկսնակ",
        total: 45000,
        source: "Meta Ads",
      },
      { name: "Լիա Ս.", item: "Անգլերեն B1", total: 35000, source: "Հղում" },
      {
        name: "Վահե Տ.",
        item: "Նկարչություն",
        total: 25000,
        source: "Instagram DM",
      },
    ],
  },
];

const STATUS_LABEL: Record<Status, string> = {
  new: "Նոր",
  confirmed: "Հաստատված",
  completed: "Առաքված",
};
const STATUS_STYLE: Record<Status, string> = {
  new: "bg-amber-100 text-amber-900",
  confirmed: "bg-blue-100 text-blue-900",
  completed: "bg-emerald-100 text-emerald-900",
};

// One tick: a new order arrives, or the oldest open one moves forward.
const TICK_MS = 1500;
const STEPS = 10;

/** Status of row `index` at animation step `step`. */
function statusAt(index: number, step: number): Status | null {
  const arrived = index * 2; // a new row every second tick
  if (step < arrived) return null;
  if (step < arrived + 2) return "new";
  if (step < arrived + 4) return "confirmed";
  return "completed";
}

export function HeroDemo() {
  // One state object, so moving to the next shop stays a pure update.
  const [{ industry, step }, setDemo] = useState({ industry: 0, step: 0 });
  const [playing, setPlaying] = useState(true);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!playing || reduced) return;
    const id = window.setInterval(() => {
      setDemo((current) =>
        current.step < STEPS
          ? { ...current, step: current.step + 1 }
          : // After the full story, move on to the next kind of shop.
            { industry: (current.industry + 1) % INDUSTRIES.length, step: 0 },
      );
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [playing, reduced]);

  // Without motion, show the finished picture.
  const shownStep = reduced ? STEPS : step;
  const shop = INDUSTRIES[industry];
  const rows = shop.rows
    .map((row, index) => ({
      ...row,
      index,
      status: statusAt(index, shownStep),
    }))
    .filter(
      (row): row is typeof row & { status: Status } => row.status !== null,
    )
    .reverse();
  const today = rows.reduce((sum, row) => sum + row.total, 0);
  const latest = rows[0];

  return (
    <div className="relative">
      <div className="relative">
        {/* The app window */}
        <div className="overflow-hidden rounded-[1.75rem] border border-white/70 bg-card/90 shadow-[0_30px_80px_-30px_rgb(73_52_160/0.35)] backdrop-blur">
          <div className="flex items-center justify-between gap-3 border-b px-5 py-3.5">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-rose-300" />
              <span className="size-2.5 rounded-full bg-amber-300" />
              <span className="size-2.5 rounded-full bg-emerald-300" />
              <span className="ml-3 text-sm font-semibold whitespace-nowrap">
                {shop.unit === "պատվեր" ? "Պատվերներ" : "Գրանցումներ"} · այսօր
              </span>
            </div>
            <span className="hidden rounded-full bg-muted px-2.5 py-1 text-xs tabular-nums text-muted-foreground sm:inline">
              {rows.length} {shop.unit}
            </span>
          </div>

          <ul
            className="flex min-h-[18.5rem] flex-col gap-1 p-3"
            aria-live="polite"
          >
            {rows.map((row) => (
              <li
                key={`${shop.key}-${row.index}`}
                className="hero-row grid grid-cols-[2.25rem_1fr_auto] items-center gap-3 rounded-2xl px-2.5 py-2.5 transition-colors hover:bg-muted/60"
              >
                <span
                  aria-hidden
                  className="flex size-9 items-center justify-center rounded-full bg-apricot/60 text-sm font-semibold"
                >
                  {row.name.charAt(0)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {row.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {row.item} · {row.source}
                  </span>
                </span>
                <span className="flex flex-col items-end gap-1">
                  <span className="text-sm font-semibold tabular-nums">
                    {formatMoney(row.total)}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors duration-500",
                      STATUS_STYLE[row.status],
                    )}
                  >
                    {shop.unit === "գրանցում" && row.status === "completed"
                      ? "Ավարտված"
                      : STATUS_LABEL[row.status]}
                  </span>
                </span>
              </li>
            ))}
            {rows.length === 0 && (
              <li className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                Սպասում ենք առաջին {shop.unit}ին…
              </li>
            )}
          </ul>
        </div>

        {/* Floating: the new-order notification */}
        {latest && latest.status === "new" && (
          <div
            key={`toast-${shop.key}-${latest.index}`}
            className="hero-toast absolute -top-5 right-3 flex items-center gap-2.5 rounded-2xl bg-primary px-3.5 py-2.5 text-primary-foreground shadow-lg sm:-right-6"
          >
            <BellRing className="size-4 text-apricot" aria-hidden />
            <span className="text-xs leading-tight">
              <span className="block font-semibold">
                Նոր {shop.unit} · {formatMoney(latest.total)}
              </span>
              <span className="block opacity-70">{latest.source}</span>
            </span>
          </div>
        )}

        {/* Floating: today's sales */}
        <div className="absolute -bottom-6 -left-2 rounded-2xl bg-card px-4 py-3 shadow-[0_18px_40px_-18px_rgb(20_20_22/0.35)] sm:-left-8">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUp className="size-3.5 text-emerald-600" aria-hidden />
            Այսօրվա վաճառք
          </span>
          <span className="mt-0.5 block text-xl font-semibold tracking-tight tabular-nums">
            {formatMoney(today)}
          </span>
        </div>
      </div>

      {/* Business-type tabs */}
      <div className="mt-12 flex items-center gap-2">
        <div
          role="tablist"
          aria-label="Բիզնեսի տեսակ"
          className="no-scrollbar -mx-1 flex flex-1 gap-1.5 overflow-x-auto px-1 py-1"
        >
          {INDUSTRIES.map((item, index) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={index === industry}
              onClick={() => setDemo({ industry: index, step: 0 })}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium whitespace-nowrap outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                index === industry
                  ? "border-ring bg-card text-foreground shadow-soft"
                  : "border-transparent bg-card/60 text-muted-foreground hover:bg-card hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        {!reduced && (
          <button
            type="button"
            onClick={() => setPlaying((value) => !value)}
            aria-label={playing ? "Դադարեցնել անիմացիան" : "Միացնել անիմացիան"}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-card shadow-soft outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            {playing ? (
              <Pause className="size-4" />
            ) : (
              <Play className="size-4" />
            )}
          </button>
        )}
      </div>
      <a
        href="#flow"
        className="mt-3 inline-block text-sm font-medium text-violet-700 underline-offset-4 outline-none hover:underline focus-visible:underline"
      >
        {shop.caption} →
      </a>
    </div>
  );
}
