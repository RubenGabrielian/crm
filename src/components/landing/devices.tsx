import type { ReactNode } from "react";
import { Lock, Pause, Play } from "lucide-react";
import { cn } from "cn";

/**
 * Device frames and small props shared by the landing page and the sign-in
 * pages: a phone, a browser window, the demo product (a plush bear) and the
 * pause button every looping demo needs.
 */

/** A phone with a dark bezel; `children` is the screen. */
export function PhoneFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative h-[35rem] w-[17.25rem] shrink-0 rounded-[2.75rem] bg-[#141416] p-[9px] shadow-[0_50px_90px_-40px_rgb(17_40_110/0.55)] ring-1 ring-black/10",
        className,
      )}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[2.2rem]">
        {children}
        <span className="absolute top-2 left-1/2 z-30 h-5 w-20 -translate-x-1/2 rounded-full bg-[#141416]" />
      </div>
    </div>
  );
}

export function StatusBar() {
  return (
    <div className="relative z-10 flex h-8 shrink-0 items-center justify-between px-6 pt-1 text-[11px] font-semibold">
      <span className="tabular-nums">10:24</span>
      <span className="flex items-center gap-1.5">
        <span className="flex items-end gap-[2px]">
          {[4, 6, 8, 10].map((height) => (
            <span
              key={height}
              style={{ height }}
              className="w-[3px] rounded-sm bg-current"
            />
          ))}
        </span>
        <span className="h-[10px] w-[20px] rounded-[3px] border border-current p-[1.5px]">
          <span className="block h-full w-3/4 rounded-[1px] bg-current" />
        </span>
      </span>
    </div>
  );
}

/**
 * A browser window around a page of the app. Its content can adapt to the
 * window's own width with container queries (@sm:, @md:, ...).
 */
export function BrowserFrame({
  url,
  children,
  className,
}: {
  url: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "@container overflow-hidden rounded-2xl bg-card shadow-[0_30px_70px_-32px_rgb(20_20_22/0.5)] ring-1 ring-black/[0.06]",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b bg-[#f7f7f8] px-3.5 py-2.5">
        <span className="flex shrink-0 gap-1.5">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
        </span>
        <span className="mx-auto flex min-w-0 items-center gap-1.5 rounded-md bg-white px-3 py-1 text-[11px] text-muted-foreground ring-1 ring-black/5">
          <Lock className="size-3 shrink-0" />
          <span className="truncate">{url}</span>
        </span>
        <span className="w-[2.6rem] shrink-0" />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

/** The tinted, dotted backdrop a demo sits on. */
export function DemoStage({
  tint,
  children,
  className,
}: {
  tint: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative rounded-[2rem] p-4 sm:p-8", tint, className)}>
      <div
        aria-hidden
        className="dot-grid-soft pointer-events-none absolute inset-0 rounded-[2rem]"
      />
      <div className="relative">{children}</div>
    </div>
  );
}

/** Pause / play for an animation that loops longer than five seconds. */
export function PlayToggle({
  playing,
  onToggle,
  className,
}: {
  playing: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={playing ? "Դադարեցնել անիմացիան" : "Միացնել անիմացիան"}
      className={cn(
        "flex size-9 items-center justify-center rounded-full border bg-card outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
    </button>
  );
}

export function BearArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 190" className={className} aria-hidden>
      <ellipse cx="100" cy="196" rx="70" ry="52" fill="#c48a5e" />
      <ellipse cx="100" cy="202" rx="40" ry="34" fill="#efcfae" />
      <circle cx="56" cy="52" r="24" fill="#c48a5e" />
      <circle cx="144" cy="52" r="24" fill="#c48a5e" />
      <circle cx="56" cy="52" r="12" fill="#efcfae" />
      <circle cx="144" cy="52" r="12" fill="#efcfae" />
      <circle cx="100" cy="96" r="58" fill="#cf9567" />
      <ellipse cx="100" cy="116" rx="27" ry="21" fill="#f3dcc2" />
      <ellipse cx="100" cy="106" rx="9" ry="6.5" fill="#3b2a20" />
      <path
        d="M100 112v7M100 119q-7 7-13 2M100 119q7 7 13 2"
        stroke="#3b2a20"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="78" cy="88" r="6.5" fill="#2b1f17" />
      <circle cx="122" cy="88" r="6.5" fill="#2b1f17" />
      <circle cx="80.5" cy="85.5" r="2" fill="#fff" />
      <circle cx="124.5" cy="85.5" r="2" fill="#fff" />
      <ellipse cx="64" cy="110" rx="9" ry="6" fill="#f08f86" opacity="0.45" />
      <ellipse cx="136" cy="110" rx="9" ry="6" fill="#f08f86" opacity="0.45" />
      <path d="M100 152l-22-11v22zM100 152l22-11v22z" fill="#185aef" />
      <circle cx="100" cy="152" r="6" fill="#185aef" />
    </svg>
  );
}
