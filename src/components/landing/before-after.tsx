"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronsLeftRight } from "lucide-react";

/**
 * Drag the handle to compare: the notebook-and-DMs way on the left,
 * the same day in Mardouk on the right.
 */
export function BeforeAfter() {
  const [split, setSplit] = useState(52);
  // Until the visitor takes the handle, it sweeps back and forth by itself
  // so both sides get seen; touching it hands control over for good.
  const [touched, setTouched] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (touched) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const element = root.current;
    if (!element) return;
    let timer = 0;
    let start = 0;
    const run = () => {
      start = performance.now();
      timer = window.setInterval(() => {
        // 7 s per round trip, easing at both ends (sine), between 10% and 90%.
        const phase = ((performance.now() - start) / 7000) * Math.PI * 2;
        setSplit(50 + 40 * Math.sin(phase));
      }, 33);
    };
    const observer = new IntersectionObserver(([entry]) => {
      window.clearInterval(timer);
      if (entry.isIntersecting) run();
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      window.clearInterval(timer);
    };
  }, [touched]);

  return (
    <div ref={root} className="relative">
      <div className="relative h-[26rem] overflow-hidden rounded-[2rem] border bg-card shadow-soft select-none has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-ring sm:h-[24rem]">
        {/* After: Mardouk (full layer underneath) */}
        <div className="absolute inset-0 grid gap-3 bg-[#f6f7f9] p-5 sm:grid-cols-[1.4fr_1fr] sm:p-7">
          <div className="rounded-2xl bg-card p-4 shadow-soft">
            <p className="text-sm font-semibold">Պատվերներ · այսօր</p>
            <ul className="mt-3 flex flex-col divide-y divide-border/70 text-sm">
              {[
                [
                  "Անի Մ.",
                  "Արջուկ × 2",
                  "16 830 ֏",
                  "Առաքված",
                  "bg-emerald-100 text-emerald-900",
                ],
                [
                  "Գոռ Հ.",
                  "Կավե կենդանիներ",
                  "7 400 ֏",
                  "Հաստատված",
                  "bg-blue-100 text-blue-900",
                ],
                [
                  "Լիլիթ Ա.",
                  "Խաղալիք-բարձ",
                  "12 500 ֏",
                  "Նոր",
                  "bg-amber-100 text-amber-900",
                ],
                [
                  "Մարիամ Ս.",
                  "Արջուկ",
                  "8 415 ֏",
                  "Առաքված",
                  "bg-emerald-100 text-emerald-900",
                ],
              ].map(([name, item, total, status, tone]) => (
                <li key={name} className="flex items-center gap-3 py-2.5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {item}
                    </span>
                  </span>
                  <span className="font-semibold tabular-nums">{total}</span>
                  <span
                    className={`hidden rounded-full px-2 py-0.5 text-[11px] font-medium sm:inline ${tone}`}
                  >
                    {status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="hidden flex-col gap-3 sm:flex">
            <div className="rounded-2xl bg-primary p-4 text-primary-foreground">
              <p className="text-xs opacity-70">Մաքուր շահույթ · հոկտեմբեր</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
                412 750 ֏
              </p>
            </div>
            <div className="rounded-2xl bg-card p-4 shadow-soft">
              <p className="text-xs text-muted-foreground">Պահեստ</p>
              <div className="mt-2 flex flex-col gap-2 text-xs">
                {[
                  ["Արջուկ", 0.62, "124"],
                  ["Տոպրակ", 0.11, "18"],
                ].map(([label, share, value]) => (
                  <span
                    key={label as string}
                    className="flex items-center gap-2"
                  >
                    <span className="w-14 text-muted-foreground">{label}</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <span
                        className={`block h-full rounded-full ${(share as number) < 0.15 ? "bg-amber-500" : "bg-[#7c5cf5]"}`}
                        style={{ width: `${(share as number) * 100}%` }}
                      />
                    </span>
                    <span className="w-8 text-right font-semibold tabular-nums">
                      {value}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <span className="absolute right-5 bottom-5 rounded-full bg-card px-3 py-1 text-xs font-semibold shadow-soft">
            Mardouk-ով
          </span>
        </div>

        {/* Before: notebook, sticky notes, DMs (clipped from the right) */}
        <div
          className="absolute inset-0 bg-[#fbf7ee]"
          style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
          aria-hidden
        >
          <div
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to bottom, transparent 0 31px, #d9d2c0 31px 32px)",
            }}
          />
          <div className="absolute top-0 bottom-0 left-12 w-px bg-rose-300/70" />
          <ul className="relative space-y-[0.55rem] pt-14 pl-16 font-[cursive] text-[15px] leading-[1.45rem] text-[#3b3a7a]">
            <li>
              Անի — 2 արջ — 19 800??{" "}
              <span className="text-rose-600">վճարե՞ց</span>
            </li>
            <li className="line-through opacity-60">Գոռ — կավե — ուրբաթ</li>
            <li>Լիլիթ — բարձ — հասցեն DM-ում</li>
            <li>գովազդ 10 000 + 15 000 (Meta?)</li>
            <li>տոպրակ ~20 մնաց ⚠</li>
            <li className="text-rose-600">շահույթ՝ ??? </li>
          </ul>
          <span className="absolute top-8 right-[8%] rotate-3 rounded-md bg-[#fff2a8] px-3 py-2 text-sm font-[cursive] text-[#5a4a00] shadow-md">
            չմոռանալ՝ Մարիամին զանգել
          </span>
          <span className="absolute right-[14%] bottom-16 -rotate-2 rounded-xl bg-[#7c5cf5] px-3 py-2 text-xs font-semibold text-white shadow-md">
            37 չկարդացված նամակ
          </span>
          <span className="absolute bottom-6 left-16 rounded-md border border-[#c9c2b0] bg-white/80 px-2.5 py-1 font-mono text-xs text-rose-600">
            =SUM(D2:D48) → #REF!
          </span>
          <span className="absolute top-5 left-5 rounded-full bg-card px-3 py-1 text-xs font-semibold shadow-soft">
            Առաջ
          </span>
        </div>

        {/* The handle */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 w-0.5 bg-primary"
          style={{ left: `${split}%` }}
        >
          <span className="absolute top-1/2 left-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
            <ChevronsLeftRight className="size-5" />
          </span>
        </div>
        <input
          type="range"
          min={4}
          max={96}
          value={split}
          step="any"
          onChange={(event) => {
            setTouched(true);
            setSplit(Number(event.currentTarget.value));
          }}
          onPointerDown={() => setTouched(true)}
          onFocus={() => setTouched(true)}
          aria-label="Համեմատել՝ առաջ և Mardouk-ով"
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        />
      </div>
    </div>
  );
}
