"use client";

import {
  Bell,
  Mail,
  PackageMinus,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import { PhoneFrame, PlayToggle } from "@/components/landing/devices";
import {
  FROZEN,
  OwnerScreen,
  saleStateAt,
  T,
} from "@/components/landing/sale-story";
import { useLoopClock } from "@/components/landing/use-loop-clock";

/**
 * The dark panel beside the sign-in forms: the owner's phone from the
 * landing hero, receiving the same order, with what changed floating beside it.
 */
export function AuthShowcase() {
  const { ref, t, playing, setPlaying, reduced } = useLoopClock({
    end: T.end,
    frozen: FROZEN,
    startVisible: true,
  });
  const { owner, buzz } = saleStateAt(t);

  return (
    <div
      ref={ref}
      className="relative flex h-full flex-col overflow-hidden rounded-[2rem] bg-primary p-8 text-white xl:p-10"
    >
      <div
        aria-hidden
        className="dot-grid-dark pointer-events-none absolute inset-0"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 size-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(24_90_239/0.28),transparent_65%)]"
      />

      <div className="relative max-w-md">
        <p className="text-2xl font-semibold tracking-tight text-balance xl:text-3xl">
          Պատվերները, պահեստը և շահույթը՝ ձեր հեռախոսում
        </p>
        <p className="mt-3 text-sm text-white/60">
          Այսպես է երևում նոր պատվերը, երբ հաճախորդը գնում է ձեր հղումով։
        </p>
      </div>

      <div
        aria-hidden
        className="relative flex flex-1 items-center justify-center py-8 [@media(max-height:860px)]:scale-90"
      >
        <div className="relative">
          <div className="-rotate-2">
            <div className={cn(buzz && "phone-buzz")}>
              <PhoneFrame className="ring-white/10">
                <OwnerScreen {...owner} />
              </PhoneFrame>
            </div>
          </div>

          <Floating
            show={owner.banner}
            icon={Bell}
            tone="bg-[#fed740] text-[#141416]"
            className="top-[14%] -left-40"
          >
            Նոր պատվեր՝ 16 830 ֏
          </Floating>
          <Floating
            show={owner.flashStock}
            icon={PackageMinus}
            tone="bg-amber-200 text-amber-950"
            className="top-[46%] -right-44"
          >
            Պահեստ՝ −2 արջուկ, −2 տոպրակ
          </Floating>
          <Floating
            show={owner.profitDelta && !owner.delivered}
            icon={TrendingUp}
            tone="bg-emerald-300 text-emerald-950"
            className="bottom-[16%] -left-40"
          >
            +9 630 ֏ մաքուր շահույթ
          </Floating>
          <Floating
            show={owner.delivered}
            icon={Mail}
            tone="bg-white text-[#141416]"
            className="top-[24%] -right-44"
          >
            Նամակ ուղարկվեց հաճախորդին
          </Floating>
        </div>
      </div>

      <div className="relative flex flex-wrap items-center gap-2 text-xs">
        {[
          "13 000 ֏ ամսական",
          "30 օր գումարի վերադարձի երաշխիք",
          "Ամբողջությամբ հայերեն",
        ].map((item) => (
          <span
            key={item}
            className="rounded-full bg-white/[0.08] px-3 py-1.5 ring-1 ring-white/10"
          >
            {item}
          </span>
        ))}
        {!reduced && (
          <PlayToggle
            playing={playing}
            onToggle={() => setPlaying((value) => !value)}
            className="ml-auto border-white/15 bg-white/10 text-white hover:bg-white/15"
          />
        )}
      </div>
    </div>
  );
}

function Floating({
  show,
  icon: Icon,
  tone,
  className,
  children,
}: {
  show: boolean;
  icon: LucideIcon;
  tone: string;
  className: string;
  children: string;
}) {
  return (
    <span
      className={cn(
        "absolute z-10 hidden items-center gap-2 rounded-2xl xl:flex px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap shadow-[0_18px_40px_-16px_rgb(0_0_0/0.6)] transition-all duration-500",
        tone,
        show ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
        className,
      )}
    >
      <Icon className="size-4" />
      {children}
    </span>
  );
}
