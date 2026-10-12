"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowDown,
  Link2,
  Pause,
  Play,
  RotateCcw,
  ShoppingBag,
  X,
} from "lucide-react";
import { cn } from "cn";
import { CountUp } from "@/components/landing/count-up";

export const PROMO_FORMATS = {
  story: { label: "Story / Reels 9:16", ratio: "9 / 16" },
  feed: { label: "Feed 4:5", ratio: "4 / 5" },
  square: { label: "Square 1:1", ratio: "1 / 1" },
} as const;
export type PromoFormat = keyof typeof PROMO_FORMATS;

/** Delay, in ms, before an element's entrance starts within its scene. */
const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

type Scene = { duration: number; background: string; render: () => ReactNode };

const SCENES: Scene[] = [
  // 1 ── Hook
  {
    duration: 3400,
    background: "bg-primary text-primary-foreground",
    render: () => (
      <>
        <p style={d(100)} className="promo-rise rounded-full bg-white/12 px-[1em] py-[0.4em] text-[0.8em]">
          Instagram-ով վաճառողների համար
        </p>
        <h1 className="mt-[0.7em] text-[2.5em] leading-[1.12] font-semibold text-balance">
          {["Վաճառք կա,", "բայց գումար", "չի՞ մնում"].map((line, index) => (
            <span key={line} style={d(350 + index * 260)} className="promo-rise block">
              {line}
            </span>
          ))}
        </h1>
      </>
    ),
  },
  // 2 ── The mess
  {
    duration: 4000,
    background: "bg-background",
    render: () => (
      <>
        <h2 style={d(80)} className="promo-rise text-[1.9em] font-semibold">
          Ծանո՞թ է
        </h2>
        <ul className="mt-[1.2em] flex w-full flex-col gap-[0.6em]">
          {["Պատվերները կորչում են DM-ներում", "Շահույթը հաշվում եք տետրում", "Excel-ը միշտ հետ է մնում"].map(
            (text, index) => (
              <li
                key={text}
                style={d(350 + index * 300)}
                className="promo-rise flex items-center gap-[0.7em] rounded-[1.2em] bg-card px-[1em] py-[0.85em] text-left shadow-soft"
              >
                <span
                  style={d(1700 + index * 220)}
                  className="promo-pop flex size-[1.9em] shrink-0 items-center justify-center rounded-full bg-destructive text-white"
                >
                  <X className="size-[1em]" strokeWidth={2.5} aria-hidden />
                </span>
                <span className="relative">
                  <span style={d(1700 + index * 220)} className="promo-dim">
                    {text}
                  </span>
                  <span
                    aria-hidden
                    style={d(1700 + index * 220)}
                    className="promo-strike absolute inset-x-0 top-1/2 h-[0.09em] bg-foreground"
                  />
                </span>
              </li>
            ),
          )}
        </ul>
        <p style={d(2900)} className="promo-rise mt-[1.2em] text-[1.15em] font-semibold">
          Կա ավելի հեշտ ձև
        </p>
      </>
    ),
  },
  // 3 ── Order by link
  {
    duration: 4800,
    background: "bg-apricot",
    render: () => (
      <>
        <Step number={1} />
        <h2 style={d(150)} className="promo-rise mt-[0.5em] text-[1.9em] leading-tight font-semibold text-balance">
          Պատվեր՝ մեկ հղումով
        </h2>
        <p
          style={d(600)}
          className="promo-rise mt-[1.1em] flex items-center gap-[0.5em] rounded-full bg-primary px-[1.1em] py-[0.7em] text-[0.9em] text-primary-foreground"
        >
          <Link2 className="size-[1.1em]" aria-hidden />
          mardouk.am/checkout/gnacq
        </p>
        <ArrowDown style={d(1300)} className="promo-pop my-[0.5em] size-[1.6em]" aria-hidden />
        <div
          style={d(1800)}
          className="promo-rise w-full rounded-[1.4em] bg-card p-[1em] text-left shadow-panel"
        >
          <p className="flex items-center justify-between text-[0.8em] text-muted-foreground">
            <span className="flex items-center gap-[0.5em]">
              <ShoppingBag className="size-[1.1em]" aria-hidden />
              Նոր պատվեր
            </span>
            <span
              style={d(2500)}
              className="promo-pop rounded-full bg-amber-100 px-[0.8em] py-[0.2em] font-medium text-amber-900"
            >
              Նոր
            </span>
          </p>
          <p className="mt-[0.5em] text-[1.15em] font-semibold">Փայտե գնացք × 2</p>
          <p className="text-[0.85em] text-muted-foreground">Անի Սարգսյան, Երևան</p>
          <p className="mt-[0.5em] text-[1.5em] font-semibold tabular-nums">24 000 ֏</p>
        </div>
      </>
    ),
  },
  // 4 ── Stock counts itself
  {
    duration: 4400,
    background: "bg-[#fde8cd]",
    render: () => (
      <>
        <Step number={2} />
        <h2 style={d(150)} className="promo-rise mt-[0.5em] text-[1.9em] leading-tight font-semibold text-balance">
          Պահեստն ինքն է հաշվում
        </h2>
        <ul className="mt-[1.1em] flex w-full flex-col gap-[0.55em]">
          {[
            { name: "Փայտե գնացք", from: 15, to: 13 },
            { name: "Փափուկ արջուկ", from: 8, to: 8 },
            { name: "Խորանարդներ", from: 2, to: 0 },
          ].map((item, index) => (
            <li
              key={item.name}
              style={d(500 + index * 220)}
              className="promo-slide flex items-center justify-between gap-[1em] rounded-[1.2em] bg-card px-[1em] py-[0.8em] text-left shadow-soft"
            >
              <span className="font-medium">{item.name}</span>
              <span className="relative text-[1.25em] font-semibold whitespace-nowrap tabular-nums">
                {item.from === item.to ? (
                  item.to
                ) : (
                  <>
                    <span style={d(2200)} className="promo-dim line-through">
                      {item.from}
                    </span>{" "}
                    <span
                      style={d(2300)}
                      className={cn("promo-pop inline-block", item.to === 0 && "text-destructive")}
                    >
                      {item.to === 0 ? "Սպառված է" : item.to}
                    </span>
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
        <p style={d(3000)} className="promo-rise mt-[1em] text-[0.95em] font-medium">
          Ամեն պատվեր նվազեցնում է մնացորդը
        </p>
      </>
    ),
  },
  // 5 ── Real net profit
  {
    duration: 5600,
    background: "bg-card",
    render: () => (
      <>
        <Step number={3} />
        <h2 style={d(150)} className="promo-rise mt-[0.5em] text-[1.9em] leading-tight font-semibold text-balance">
          Իրական մաքուր շահույթ
        </h2>
        <dl className="mt-[1em] flex w-full flex-col gap-[0.5em] text-left text-[0.85em]">
          {[
            { label: "Մուտք", value: "486 000 ֏", width: "100%", strong: true },
            { label: "Ինքնարժեք", value: "−212 000 ֏", width: "44%" },
            { label: "Առաքում", value: "−38 000 ֏", width: "8%" },
            { label: "Գովազդ", value: "−54 000 ֏", width: "11%" },
            { label: "Այլ ծախսեր", value: "−31 000 ֏", width: "6%" },
          ].map((line, index) => (
            <div key={line.label} style={d(450 + index * 240)} className="promo-rise">
              <div className={cn("flex justify-between", line.strong ? "font-semibold" : "text-muted-foreground")}>
                <dt>{line.label}</dt>
                <dd className="tabular-nums">{line.value}</dd>
              </div>
              <span className="mt-[0.3em] block h-[0.5em] rounded-full bg-muted">
                <span
                  style={{ ...d(650 + index * 240), width: line.width }}
                  className={cn(
                    "promo-grow block h-full rounded-full",
                    line.strong ? "bg-primary" : "bg-foreground/35",
                  )}
                />
              </span>
            </div>
          ))}
        </dl>
        <div style={d(2300)} className="promo-pop mt-[0.9em] w-full rounded-[1.3em] bg-apricot p-[0.9em] text-left">
          <p className="text-[0.85em] font-medium">Մաքուր շահույթ</p>
          <p className="text-[2em] leading-tight font-semibold">
            <CountUp value={151000} suffix=" ֏" duration={1600} />
          </p>
        </div>
        <p style={d(3600)} className="promo-rise mt-[0.7em] flex gap-[0.5em] text-[0.8em] font-medium">
          <span className="rounded-full bg-muted px-[0.9em] py-[0.35em]">ROAS 9×</span>
          <span className="rounded-full bg-muted px-[0.9em] py-[0.35em]">Շահութաբերություն 31%</span>
        </p>
      </>
    ),
  },
  // 6 ── Call to action
  {
    duration: 4400,
    background: "bg-primary text-primary-foreground",
    render: () => (
      <>
        <span
          style={d(100)}
          className="promo-pop flex size-[3em] items-center justify-center rounded-full bg-apricot text-[1.4em] font-semibold text-primary"
        >
          M
        </span>
        <p style={d(400)} className="promo-rise mt-[0.6em] text-[1.5em] font-semibold">
          Mardouk
        </p>
        <h2 style={d(750)} className="promo-rise mt-[0.6em] text-[2em] leading-[1.15] font-semibold text-balance">
          Թողեք Excel-ը։ Տեսեք իրական պատկերը։
        </h2>
        <p
          style={d(1500)}
          className="promo-pop mt-[1.2em] rounded-full bg-apricot px-[1.4em] py-[0.75em] text-[1.1em] font-semibold text-primary"
        >
          Գրանցվեք՝ mardouk.am
        </p>
      </>
    ),
  },
];

function Step({ number }: { number: number }) {
  return (
    <span className="promo-pop flex size-[2.2em] items-center justify-center rounded-full bg-primary text-[0.9em] font-semibold text-primary-foreground tabular-nums">
      {number}
    </span>
  );
}

export function PromoPlayer({ format, clean }: { format: PromoFormat; clean: boolean }) {
  const [scene, setScene] = useState(0);
  // Bumped on restart so the first scene replays even if it is already showing.
  const [run, setRun] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(
      () => setScene((current) => (current + 1) % SCENES.length),
      SCENES[scene].duration,
    );
    return () => clearTimeout(timer);
  }, [scene, run, playing]);

  const current = SCENES[scene];
  const totalSeconds = Math.round(SCENES.reduce((sum, item) => sum + item.duration, 0) / 1000);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 p-4">
      {/* The stage. Everything inside is sized in em from the stage width, so
          it looks the same at any recording size. */}
      <div
        style={{ aspectRatio: PROMO_FORMATS[format].ratio }}
        className={cn(
          "relative h-[min(88dvh,calc((100vw-2rem)*2))] max-w-full overflow-hidden [container-type:inline-size]",
          clean ? "h-dvh" : "rounded-[2rem] shadow-panel",
          !playing && "promo-paused",
        )}
      >
        <div
          key={`${scene}-${run}`}
          className={cn(
            "promo-scene absolute inset-0 flex flex-col items-center justify-center px-[7cqw] text-center text-[4.4cqw]",
            current.background,
          )}
        >
          {current.render()}
        </div>
      </div>

      {!clean && (
        <div className="flex flex-col items-center gap-3 text-sm">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setPlaying(!playing)}
              className="flex h-10 items-center gap-2 rounded-full bg-primary px-4 font-medium text-primary-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
              {playing ? "Դադար" : "Շարունակել"}
            </button>
            <button
              type="button"
              onClick={() => {
                setScene(0);
                setRun(run + 1);
                setPlaying(true);
              }}
              className="flex h-10 items-center gap-2 rounded-full bg-card px-4 font-medium shadow-soft outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <RotateCcw className="size-4" />
              Սկզբից
            </button>
            {(Object.keys(PROMO_FORMATS) as PromoFormat[]).map((key) => (
              <Link
                key={key}
                href={`/promo?format=${key}`}
                aria-current={key === format ? "true" : undefined}
                className={cn(
                  "flex h-10 items-center rounded-full px-4 font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  key === format ? "bg-apricot text-primary" : "bg-card shadow-soft",
                )}
              >
                {PROMO_FORMATS[key].label}
              </Link>
            ))}
          </div>
          <p className="max-w-xl text-center text-muted-foreground">
            Տեսանյութը {totalSeconds} վայրկյան է և կրկնվում է։ Ձայնագրելու համար բացեք{" "}
            <Link href={`/promo?format=${format}&clean=1`} className="font-medium text-foreground underline">
              մաքուր տարբերակը
            </Link>{" "}
            (առանց կոճակների) և ձայնագրեք էկրանը։
          </p>
        </div>
      )}
    </div>
  );
}
