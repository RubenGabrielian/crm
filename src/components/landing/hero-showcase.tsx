"use client";

import type { ReactNode } from "react";
import { Store, UserRound } from "lucide-react";
import { cn } from "cn";
import { PhoneFrame, PlayToggle } from "./devices";
import {
  CustomerScreen,
  FROZEN,
  OwnerScreen,
  saleStateAt,
  T,
} from "./sale-story";
import { progress, within } from "./timeline";
import { useLoopClock } from "./use-loop-clock";

/**
 * The hero: one real sale on two phones, with the title, description and
 * calls to action (passed in by the page) between them. The customer orders
 * on the left; the owner sees it on the right; an arc carries the order to
 * the owner and the "delivered" email back to the customer.
 */
export function HeroShowcase({ children }: { children: ReactNode }) {
  const { ref, t, playing, setPlaying, reduced } = useLoopClock<HTMLElement>({
    end: T.end,
    frozen: FROZEN,
    startVisible: true,
  });
  const story = saleStateAt(t);

  // ── The wire between the phones ──
  const sending = within(t, T.send[0], T.send[1]);
  const replying = within(t, T.reply[0], T.reply[1]);
  const litSend = t < T.send[0] ? 0 : t < T.reply[0] ? progress(t, T.send) : 0;
  const litReply = t < T.reply[0] ? 0 : progress(t, T.reply);
  const packet = sending
    ? progress(t, T.send)
    : replying
      ? 1 - progress(t, T.reply)
      : null;
  const wireLabel =
    t >= T.send[0] && t < T.reply[0]
      ? "Նոր պատվեր՝ 16 830 ֏"
      : t >= T.reply[0] && t < T.end - 1200
        ? "Նամակ՝ «Առաքված է»"
        : "Հաճախորդը ⟷ Դուք";
  // On phones only one screen fits, so it follows the story.
  const ownerFocus = within(t, T.send[1] - 150, T.reply[0] + 300);

  return (
    <section
      ref={ref}
      className="relative grid gap-12 xl:-mx-16 xl:grid-cols-[17.5rem_minmax(0,1fr)_17.5rem] xl:items-center xl:gap-14"
    >
      <div
        aria-hidden
        className="dot-grid pointer-events-none absolute -inset-x-6 -top-12 -bottom-10 -z-10 sm:-inset-x-16"
      />

      {/* Title, description and calls to action, from the page */}
      <div className="text-center xl:col-start-2 xl:row-start-1">
        {children}
        <Wire
          className="hidden xl:block"
          litSend={litSend}
          litReply={litReply}
          packet={packet}
          label={wireLabel}
        />
      </div>

      <p className="sr-only">
        Օրինակ․ հաճախորդը պատվիրում է ապրանքի հղումով, իսկ դուք անմիջապես
        տեսնում եք նոր պատվերը, պահեստը նվազում է, շահույթը թարմանում է, և
        «Առաքված» նշելիս հաճախորդը նամակ է ստանում։
      </p>

      {/* The two phones */}
      <div
        aria-hidden
        className="relative grid justify-items-center gap-x-16 md:grid-cols-2 md:justify-center xl:contents"
      >
        <span className="row-start-1 mb-5 inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-medium shadow-soft md:hidden">
          {ownerFocus ? (
            <Store className="size-3.5" />
          ) : (
            <UserRound className="size-3.5" />
          )}
          {ownerFocus ? "Ձեր հեռախոսը" : "Հաճախորդի հեռախոսը"}
        </span>

        <PhoneSlot
          className={cn(
            "col-start-1 row-start-2 md:row-start-1 xl:col-start-1 xl:row-start-1",
            ownerFocus &&
              "max-md:pointer-events-none max-md:scale-95 max-md:opacity-0",
          )}
          label="Հաճախորդը"
          icon={<UserRound className="size-3.5" />}
          tilt="md:-rotate-2 xl:-rotate-3"
        >
          <CustomerScreen {...story.customer} />
        </PhoneSlot>

        <PhoneSlot
          className={cn(
            "col-start-1 row-start-2 md:col-start-2 md:row-start-1 xl:col-start-3 xl:row-start-1",
            !ownerFocus &&
              "max-md:pointer-events-none max-md:scale-95 max-md:opacity-0",
          )}
          label="Դուք"
          icon={<Store className="size-3.5" />}
          tilt="md:rotate-2 xl:rotate-3"
          buzz={story.buzz}
        >
          <OwnerScreen {...story.owner} />
        </PhoneSlot>

        {/* Tablet: the wire's message floats between the phones */}
        <span className="pointer-events-none absolute top-1/2 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 rounded-full bg-card px-3 py-1.5 text-xs font-medium whitespace-nowrap shadow-soft md:block xl:hidden">
          {wireLabel}
        </span>
      </div>

      {!reduced && (
        <PlayToggle
          playing={playing}
          onToggle={() => setPlaying((value) => !value)}
          className="-mt-6 justify-self-center xl:col-start-2 xl:row-start-2 xl:-mt-8"
        />
      )}
    </section>
  );
}

// ── The arc between the phones (wide screens) ─────────────────

const ARC = "M0 10 Q300 120 600 10";
const ARC_BACK = "M600 10 Q300 120 0 10";

function arcPoint(p: number) {
  const x = 2 * (1 - p) * p * 300 + p * p * 600;
  const y = (1 - p) * (1 - p) * 10 + 2 * (1 - p) * p * 120 + p * p * 10;
  return { x, y };
}

function Wire({
  className,
  litSend,
  litReply,
  packet,
  label,
}: {
  className?: string;
  litSend: number;
  litReply: number;
  packet: number | null;
  label: string;
}) {
  const dot = packet === null ? null : arcPoint(packet);
  return (
    <div
      aria-hidden
      className={cn("relative -mx-14 mt-10 aspect-[5/1]", className)}
    >
      <svg
        viewBox="0 0 600 120"
        className="absolute inset-0 h-full w-full overflow-visible"
      >
        <path
          d={ARC}
          fill="none"
          stroke="#b9bdc7"
          strokeWidth={1.5}
          strokeDasharray="4 7"
        />
        <path
          d={ARC}
          fill="none"
          stroke="#185aef"
          strokeWidth={2.5}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={1 - litSend}
        />
        <path
          d={ARC_BACK}
          fill="none"
          stroke="#10b981"
          strokeWidth={2.5}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={1 - litReply}
        />
        <circle cx="0" cy="10" r="4" fill="var(--primary)" />
        <circle cx="600" cy="10" r="4" fill="var(--primary)" />
        {dot && (
          <circle
            cx={dot.x}
            cy={dot.y}
            r="7"
            fill={litReply > 0 ? "#10b981" : "#185aef"}
            style={{ filter: "drop-shadow(0 0 6px rgb(24 90 239 / 0.6))" }}
          />
        )}
      </svg>
      <span className="absolute top-[54%] left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-card px-3 py-1.5 text-xs font-medium whitespace-nowrap shadow-soft">
        {label}
      </span>
    </div>
  );
}

function PhoneSlot({
  className,
  label,
  icon,
  tilt,
  buzz,
  children,
}: {
  className?: string;
  label: string;
  icon: ReactNode;
  tilt: string;
  buzz?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center transition-[opacity,transform] duration-500",
        className,
      )}
    >
      <span className="mb-5 hidden items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-medium shadow-soft md:inline-flex">
        {icon}
        {label}
      </span>
      <div className={tilt}>
        <div className={cn(buzz && "phone-buzz")}>
          <PhoneFrame>{children}</PhoneFrame>
        </div>
      </div>
    </div>
  );
}
