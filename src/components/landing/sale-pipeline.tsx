"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  Link2,
  MessageCircle,
  Pause,
  Play,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { cn } from "cn";

// One sale, told in three panels: the DM, the order, the money.
// Each tick reveals the next piece; the whole story loops.
const TICK_MS = 420;
const LAST = 12;

function useStory() {
  const root = useRef<HTMLDivElement>(null);
  const [tick, setTick] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [inView, setInView] = useState(false);
  const [reduced, setReduced] = useState(false);

  // The story starts when the section scrolls into view, not on page load.
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      {
        threshold: 0.3,
      },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!playing || !inView || reduced) return;
    const id = window.setInterval(
      // Hold the finished picture for a few ticks before starting over.
      () => setTick((value) => (value >= LAST + 6 ? 0 : value + 1)),
      TICK_MS,
    );
    return () => window.clearInterval(id);
  }, [playing, inView, reduced]);

  return { root, tick: reduced ? LAST : tick, playing, setPlaying, reduced };
}

export function SalePipeline() {
  const { root, tick, playing, setPlaying, reduced } = useStory();
  const at = (step: number) => tick >= step;
  const stage = tick < 4 ? 0 : tick < 8 ? 1 : 2;

  return (
    <div ref={root} className="relative">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-stretch">
        {/* 1. The DM */}
        <Panel
          active={stage === 0}
          icon={MessageCircle}
          label="Instagram DM"
          step="01"
        >
          <div className="flex flex-col gap-2">
            <Bubble show={at(1)} side="in">
              Բարև, փափուկ արջուկը դեռ կա՞
            </Bubble>
            <Bubble show={at(2)} side="out">
              Այո՛, պատվիրեք հղումով 👇
            </Bubble>
            <div
              className={cn(
                "ml-auto w-[85%] rounded-2xl border bg-card p-2.5 shadow-soft transition-all duration-300",
                at(3) ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
              )}
            >
              <div className="flex items-center gap-2.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f0f5ff] text-lg">
                  🧸
                </span>
                <span className="min-w-0 text-xs">
                  <span className="block truncate font-semibold">
                    Փափուկ արջուկ
                  </span>
                  <span className="block text-muted-foreground">
                    <s>9 900 ֏</s>{" "}
                    <span className="font-semibold text-foreground">
                      8 415 ֏
                    </span>{" "}
                    · −15%
                  </span>
                </span>
              </div>
              <span className="mt-2 flex items-center gap-1 truncate rounded-lg bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                <Link2 className="size-3 shrink-0" aria-hidden />
                numa.am/checkout/…
              </span>
            </div>
            <Bubble show={at(4)} side="in">
              Պատվիրեցի ✔
            </Bubble>
          </div>
        </Panel>

        <Connector lit={at(4)} />

        {/* 2. The order */}
        <Panel
          active={stage === 1}
          icon={ShoppingBag}
          label="Numa · նոր պատվեր"
          step="02"
        >
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
            <Field show={at(5)} term="Հաճախորդ" value="Անի Մ. · 094 ···· 21" />
            <Field show={at(5)} term="Ապրանք" value="Փափուկ արջուկ × 2" />
            <Field show={at(6)} term="Առաքում" value="Անվճար · Կոմիտաս 12" />
            <Field show={at(6)} term="Ընդամենը" value="16 830 ֏" strong />
          </dl>
          <div
            className={cn(
              "mt-4 flex flex-wrap gap-1.5 transition-opacity duration-300",
              at(7) ? "opacity-100" : "opacity-0",
            )}
          >
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors duration-300",
                at(8)
                  ? "bg-emerald-100 text-emerald-900"
                  : "bg-amber-100 text-amber-900",
              )}
            >
              {at(8) ? "Առաքված · նամակ ուղարկված" : "Նոր"}
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              Պահեստ −2 · Տոպրակ −2
            </span>
          </div>
        </Panel>

        <Connector lit={at(8)} />

        {/* 3. The money */}
        <Panel active={stage === 2} icon={TrendingUp} label="Շահույթ" step="03">
          <dl className="grid grid-cols-[1fr_auto] gap-y-1.5 text-sm tabular-nums">
            <Money show={at(9)} term="Վաճառք" value="16 830 ֏" />
            <Money show={at(10)} term="Ինքնարժեք" value="−6 800 ֏" muted />
            <Money show={at(10)} term="Տոպրակ, պիտակ" value="−400 ֏" muted />
          </dl>
          <div
            className={cn(
              "mt-3 rounded-2xl bg-primary px-4 py-3 text-primary-foreground transition-all duration-300",
              at(11) ? "opacity-100" : "opacity-0",
            )}
          >
            <span className="block text-xs opacity-70">Այս պատվերից</span>
            <span className="block text-2xl font-semibold tracking-tight tabular-nums">
              +9 630 ֏
            </span>
          </div>
          <p
            className={cn(
              "mt-3 flex items-center gap-1.5 text-xs text-muted-foreground transition-opacity duration-300",
              at(12) ? "opacity-100" : "opacity-0",
            )}
          >
            <Check className="size-3.5 text-emerald-600" aria-hidden />
            Ամսվա մաքուր շահույթը թարմացվեց
          </p>
        </Panel>
      </div>

      {!reduced && (
        <button
          type="button"
          onClick={() => setPlaying((value) => !value)}
          aria-label={playing ? "Դադարեցնել անիմացիան" : "Միացնել անիմացիան"}
          className="mt-4 ml-auto flex size-9 items-center justify-center rounded-full border bg-card outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </button>
      )}
    </div>
  );
}

function Panel({
  active,
  icon: Icon,
  label,
  step,
  children,
}: {
  active: boolean;
  icon: typeof MessageCircle;
  label: string;
  step: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex min-h-[19rem] flex-col rounded-[1.75rem] border bg-card p-5 transition-[box-shadow,transform,border-color] duration-300",
        active
          ? "-translate-y-1 border-primary/70 shadow-[0_22px_50px_-26px_rgb(20_20_22/0.45)]"
          : "border-border shadow-soft",
      )}
    >
      <header className="mb-4 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="size-4" aria-hidden />
          {label}
        </span>
        <span className="font-mono text-xs text-muted-foreground">{step}</span>
      </header>
      {children}
    </section>
  );
}

function Connector({ lit }: { lit: boolean }) {
  return (
    <div aria-hidden className="flex items-center justify-center lg:w-10">
      <span className="relative block h-8 w-px overflow-hidden bg-border lg:h-px lg:w-full">
        <span
          className={cn(
            "absolute inset-0 origin-top bg-primary transition-transform duration-400 lg:origin-left",
            lit ? "scale-100" : "scale-y-0 lg:scale-x-0 lg:scale-y-100",
          )}
        />
      </span>
    </div>
  );
}

function Bubble({
  show,
  side,
  children,
}: {
  show: boolean;
  side: "in" | "out";
  children: React.ReactNode;
}) {
  return (
    <p
      className={cn(
        "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm transition-all duration-300",
        side === "in"
          ? "self-start rounded-bl-md bg-muted"
          : "self-end rounded-br-md bg-[#185aef] text-white",
        show ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
      )}
    >
      {children}
    </p>
  );
}

function Field({
  show,
  term,
  value,
  strong,
}: {
  show: boolean;
  term: string;
  value: string;
  strong?: boolean;
}) {
  const visibility = show ? "opacity-100" : "opacity-0";
  return (
    <>
      <dt
        className={cn(
          "text-muted-foreground transition-opacity duration-300",
          visibility,
        )}
      >
        {term}
      </dt>
      <dd
        className={cn(
          "text-right transition-opacity duration-300",
          strong && "font-semibold tabular-nums",
          visibility,
        )}
      >
        {value}
      </dd>
    </>
  );
}

function Money({
  show,
  term,
  value,
  muted,
}: {
  show: boolean;
  term: string;
  value: string;
  muted?: boolean;
}) {
  const visibility = show
    ? "opacity-100 translate-x-0"
    : "opacity-0 -translate-x-1";
  return (
    <>
      <dt
        className={cn(
          "text-muted-foreground transition-all duration-300",
          visibility,
        )}
      >
        {term}
      </dt>
      <dd
        className={cn(
          "text-right transition-all duration-300",
          muted ? "text-muted-foreground" : "font-semibold",
          visibility,
        )}
      >
        {value}
      </dd>
    </>
  );
}
